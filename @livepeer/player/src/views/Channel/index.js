import React from 'react'
import { bindActionCreators, compose } from 'redux'
import { connect } from 'react-redux'
import { compose as composeGraphql, graphql } from 'react-apollo'
import gql from 'graphql-tag'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import {
  Facebook,
  Link as LinkIcon,
  Search,
  ThumbsUp,
  Twitter,
} from 'react-feather'
import { VideoPlayer, Snapshot } from '@livepeer/chroma'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import {
  actions as routingActions,
  // selectors as routingSelectors,
} from '../../services/routing'
import {
  actions as jobsActions,
  selectors as jobsSelectors,
} from '../../services/jobs'

const { changeChannel } = routingActions
const { updateJob } = jobsActions
const { getLiveJobsByChannel, getLiveJobsByBroadcaster } = jobsSelectors

const mapStateToProps = (state, ownProps) => {
  const { channel } = ownProps.match.params
  const isAddress = channel.length === 42
  return {
    jobs: isAddress
      ? getLiveJobsByBroadcaster(channel)(state)
      : getLiveJobsByChannel(channel)(state),
  }
}

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      changeChannel,
      updateJob,
    },
    dispatch,
  )

const connectRedux = connect(mapStateToProps, mapDispatchToProps)

const GetJobQuery = gql`
  query GetJob($id: Int!, $streamRootUrl: String) {
    job(id: $id) {
      id
      broadcaster
      stream
      transcoder
      profiles {
        id
        name
        bitrate
        framerate
        resolution
      }
      ... on VideoJob {
        live(streamRootUrl: $streamRootUrl)
        url(streamRootUrl: $streamRootUrl)
      }
    }
  }`
const GetJobsQuery = gql`
  query JobsQuery($dead: Boolean, $streamRootUrl: String, $broadcaster: String) {
    jobs(dead: $dead, streamRootUrl: $streamRootUrl, broadcaster: $broadcaster) {
      id
      broadcaster
      stream
      transcoder
      profiles {
        id
        name
        bitrate
        framerate
        resolution
      }
      ... on VideoJob {
        live(streamRootUrl: $streamRootUrl)
        url(streamRootUrl: $streamRootUrl)
      }
    }
  }`
const connectApollo = composeGraphql(
  graphql(GetJobsQuery, {
    pollInterval: 10,
    skip: ({ match }) => {
      const { channel } = match.params
      return channel.length !== 42
    },
    props: ({ data, ownProps }) => {
      // const { channel } = props.match.params
      // console.log(data, ownProps)
      return {
        ...ownProps,
        loading: data.loading,
        liveJobs: data.jobs ? [data.jobs[data.jobs.length - 1]] : [],
      }
    },
    options: ({ match }) => {
      const { channel } = match.params
      return {
        variables: {
          broadcaster: channel,
          streamRootUrl: 'http://d194z9vj66yekd.cloudfront.net/stream/',
        },
      }
    },
  }),
  // graphql(GetJobQuery, {
  //   skip: ({ match }) => {
  //     const { channel } = match.params
  //     return channel.length === 42
  //   },
  //   props: (res, props) => {
  //     return {
  //       ...props,
  //       loading: res.data.loading,
  //       liveJobs: res.data.job ? [res.data.job] : [],
  //     }
  //   },
  //   options: ({ match }) => {
  //     const { channel } = match.params
  //     return {
  //       variables: {
  //         id: 0,
  //         streamRootUrl: 'https://d194z9vj66yekd.cloudfront.net/stream/',
  //       },
  //     }
  //   },
  // }),
)

const enhance = compose(connectRedux, connectApollo)

const Channel = ({
  liveJobs,
  jobs,
  loading,
  match,
  changeChannel,
  updateJob,
}) => {
  const [mostRecentJob] = liveJobs
  const {
    jobId,
    stream,
    broadcaster = match.params.channel,
    live,
    poster,
    url = '',
  } =
    mostRecentJob || {}
  return loading ? (
    'Loading...'
  ) : (
    <div>
      <Navbar>
        <Nav>
          <Link to="/" style={{ lineHeight: 0, padding: '8px 0' }}>
            <img src="/wordmark.svg" height="24" />
          </Link>
          <div
            style={{
              width: '50%',
              maxWidth: 480,
              paddingLeft: 40,
              position: 'relative',
            }}
          >
            <Search
              color="#fff"
              size={24}
              style={{ opacity: 0.75, position: 'absolute', top: 4, left: 8 }}
            />
            <input
              type="search"
              placeholder="Search by broadcaster address or stream ID"
              style={{
                width: '100%',
                height: 32,
                margin: 0,
                padding: '0 16px',
                background: 'rgba(255,255,255,.2)',
                color: '#fff',
                outline: 0,
                border: 'none',
                borderRadius: 4,
              }}
              onKeyDown={e => {
                if (e.keyCode !== 13) return
                changeChannel(e.target.value)
                e.target.value = ''
              }}
            />
          </div>
        </Nav>
      </Navbar>
      <Content>
        <Media>
          {!live && (
            <div
              style={{
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#000',
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                color: '#fff',
                zIndex: 1,
              }}
            >
              <p>This broadcaster is currently offline</p>
            </div>
          )}
          <VideoPlayer
            preload="auto"
            autoPlay={false}
            poster={!live ? '/wordmark.svg' : ''}
            src={url}
            aspectRatio="16:9"
          />
        </Media>
        <Info>
          <Snapshot
            at={1}
            defaultSrc="/wordmark.svg"
            url={url}
            width={72}
            height={72}
            style={{
              backgroundColor: '#ccc',
              borderRadius: '2px',
              boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
            }}
          />
          <div style={{ width: 'calc(100% - 72px)' }}>
            <ChannelStatus live={live}>
              <span>•</span>
              {live ? 'live' : 'offline'}
            </ChannelStatus>
            <p>
              Broadcaster:<br />
              <span>{broadcaster}</span>
            </p>
            <p
              style={{
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              Stream ID:<br />
              <span>{stream || 'N/A'}</span>
            </p>
          </div>
        </Info>
        <div>
          <p
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              paddingRight: 8,
              width: '100%',
              fontSize: 12,
              color: '#888',
            }}
          >
            Share: &nbsp;
            <Facebook
              color="#03a678"
              size={18}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                window.confirm('Share on Facebook...')
              }}
            />
            &nbsp;&nbsp;
            <Twitter
              color="#03a678"
              size={18}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                window.confirm('Share on Twitter...')
              }}
            />
            &nbsp;&nbsp;
            <LinkIcon
              color="#03a678"
              size={18}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                window.confirm(
                  `Here's your shareable url:\n\n${window.location}`,
                )
              }}
            />
          </p>
        </div>
        <br />
        <br />
        <div>
          <h3 style={{ color: '#555' }}>Streaming Now</h3>
          <hr style={{ border: 0, borderTop: '1px solid #eee' }} />
          <div
            style={{
              display: 'inline-flex',
              width: '100%',
              marginTop: -16,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {[
              'http://static.filehorse.com/screenshots-web/online-games/minecraft-screenshot-02.jpg',
              'http://catbordhi.com/wp-content/uploads/015.jpg',
              'https://i.ytimg.com/vi/sUStdzuKKL8/hqdefault.jpg',
              'https://ak3.picdn.net/shutterstock/videos/3818060/thumb/1.jpg',
              'http://www.iac.lu.se/wp-content/uploads/2015/06/video_studio.jpg',
              'https://i.ytimg.com/vi/hGE2EUiE7Oo/maxresdefault.jpg',
              'https://www.geek.com/wp-content/uploads/2016/03/video-game-streaming-625x350.jpg',
            ].map((url, i) => (
              <span
                key={i}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: 'calc(100% / 7)',
                  paddingBottom: 'calc(100% / 7)',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 16,
                    left: 8,
                    right: 8,
                    margin: 'auto',
                    backgroundColor: '#ccc',
                    backgroundImage: `url(${url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    window.confirm(
                      'Probably link to some hard-coded 24/7 streams here',
                    )
                  }}
                />
              </span>
            ))}
          </div>
          <p style={{ textAlign: 'right', padding: '0 8px', fontSize: 12 }}>
            <a href="#">See more</a>
          </p>
        </div>
      </Content>
      <Footer>
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100vw',
            background: '#fff',
            boxShadow: '0 0 2px 0 rgba(0,0,0,.1)',
          }}
        >
          <div
            style={{
              width: 640,
              maxWidth: '100%',
              margin: '0 auto',
              padding: 16,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                flexFlow: 'row-wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <ThumbsUp color="#03a678" size={32} />
              <p
                style={{
                  width: '75%',
                  margin: 0,
                  paddingLeft: 16,
                  lineHeight: 1.5,
                  color: '#555',
                }}
              >
                Enjoying the show? Show your appreciation.<br />
                <a href="#" style={{ fontSize: 12 }}>
                  Learn more
                </a>
              </p>
              <p style={{ margin: 0 }}>
                <button
                  style={{
                    background: '#03a678',
                    color: '#fff',
                    outline: 0,
                    border: 'none',
                    borderRadius: 4,
                    margin: 0,
                    padding: '8px 12px',
                    fontSize: 12,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    window.prompt(
                      'Enter an amount of LPT or ETH. Probably need MetaMask for this feature...',
                    )
                  }}
                >
                  ♥ &nbsp;&nbsp;Leave a tip
                </button>
              </p>
            </div>
          </div>
        </div>
      </Footer>
    </div>
  )
}

const Nav = styled.nav`
  display: flex;
  flex-flow: row;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  margin-bottom: 24px;
  padding: 16px 24px;
  background: #03a678;
  & *::placeholder {
    color: #fff;
  }
  & > a {
    text-decoration: none;
    font-size: 16px;
    color: #fff;
  }
`

const ChannelStatus = styled.span`
  position: absolute;
  right: 8px;
  top: 8px;
  text-transform: uppercase;
  color: #555;
  font-size: 12px;
  span {
    display: inline-block;
    transform: scale(2);
    margin-right: 4px;
    color: ${({ live }) => (live ? 'red' : '#aaa')};
  }
`

const Content = styled.div`
  position: relative;
  display: flex;
  flex-flow: column;
  max-width: 672px;
  margin: 0 auto 120px auto;
  padding: 0 16px;
`

const Media = styled.div`
  position: relative;
  display: inline-flex;
  align-items: flex-start;
  width: 100%;
  max-width: 640px;
  background: #000;
  overflow: hidden;
`

const Info = styled.div`
  position: relative;
  display: flex;
  border: 1px solid #eee;
  border-radius: 0 0 4px 4px;
  padding: 8px 56px 8px 8px;
  background: #fff;
  p {
    margin: 0;
    padding: 0px 8px 8px 8px;
    font-size: 12px;
    color: #555;
    span {
      font-size: 12px;
      color: #aaa;
    }
  }
`

export default enhance(Channel)