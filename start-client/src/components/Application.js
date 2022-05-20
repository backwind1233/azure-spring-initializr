import BodyClassName from 'react-body-classname'
import FileSaver from 'file-saver'
import get from 'lodash.get'
import React, {
  Suspense,
  lazy,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { toast } from 'react-toastify'

import useHash from './utils/Hash'
import useWindowsUtils from './utils/WindowsUtils'
import { AppContext } from './reducer/App'
import { DependencyDialog } from './common/dependency'
import { Fields, Loading } from './common/builder'
import { Form } from './common/form'
import { Header, SideLeft, SideRight } from './common/layout'
import { InitializrContext } from './reducer/Initializr'
import { getConfig, getInfo, getProject, getGitParams } from './utils/ApiUtils'

const Explore = lazy(() => import('./common/explore/Explore.js'))
const Share = lazy(() => import('./common/share/Share.js'))
const HotKeys = lazy(() => import('./common/builder/HotKeys.js'))

export default function Application() {
  const {
    complete,
    dispatch,
    theme,
    share: shareOpen,
    explore: exploreOpen,
    list,
    dependencies,
  } = useContext(AppContext)
  const { values, share, git, dispatch: dispatchInitializr } = useContext(
    InitializrContext
  )

  const [blob, setBlob] = useState(null)
  const [generating, setGenerating] = useState(false)

  const buttonExplore = useRef(null)
  const buttonDependency = useRef(null)
  const buttonSubmit = useRef(null)

  const windowsUtils = useWindowsUtils()
  useHash()

  useEffect(() => {
    if (windowsUtils.origin) {
      const url = `${windowsUtils.origin}/metadata/client`
      getInfo(url).then(jsonConfig => {
        const response = getConfig(jsonConfig)
        dispatchInitializr({ type: 'COMPLETE', payload: { ...response } })
        dispatch({ type: 'COMPLETE', payload: response })
      }).then(() => {
        const url2 = `${windowsUtils.origin}/metadata/oauthapps`
        return fetch(url2)
          .then(res => res.json())
          .then(res => {
            dispatchInitializr({ type: 'GIT_READY', payload: res })
          })
      })
    }
  }, [dispatch, dispatchInitializr, windowsUtils.origin])

  const onSubmit = async () => {
    if (generating || list) {
      return
    }
    setGenerating(true)
    const url = `${windowsUtils.origin}/starter.zip`
    const project = await getProject(
      url,
      values,
      get(dependencies, 'list')
    ).catch(() => {
      toast.error(`Could not connect to server. Please check your network.`)
    })
    setGenerating(false)
    if (project) {
      FileSaver.saveAs(project, `${get(values, 'meta.artifact')}.zip`)
    }
  }

  const onPush = async (e) => {
    let { enabled, clientId, oauthUri, redirectUri } = get(git, 'github', {});
    const redirectParams = getGitParams(values, get(dependencies, 'list'));
    if (enabled) {
      const url = [
        oauthUri,
        '?client_id=',
        clientId,
        '&redirect_uri=',
        encodeURIComponent(`${redirectUri}?${redirectParams}&gitServiceType=github`),
        '&state=',
        Date.now().toString(36),
        '&scope=repo',
      ].join('');
      location.assign(url);
    }
  }

  const onExplore = async () => {
    const url = `${windowsUtils.origin}/starter.zip`
    dispatch({ type: 'UPDATE', payload: { explore: true, list: false } })
    const project = await getProject(
      url,
      values,
      get(dependencies, 'list')
    ).catch(() => {
      toast.error(`Could not connect to server. Please check your network.`)
    })
    setBlob(project)
  }

  const onShare = () => {
    dispatch({ type: 'UPDATE', payload: { share: true } })
  }

  const onEscape = () => {
    setBlob(null)
    dispatch({
      type: 'UPDATE',
      payload: { list: false, share: false, explore: false, nav: false },
    })
  }

  return (
    <>
      <BodyClassName className={theme} />
      <Suspense fallback=''>
        <HotKeys
          onSubmit={() => {
            if (get(buttonSubmit, 'current')) {
              buttonSubmit.current.click()
            }
          }}
          onExplore={() => {
            if (get(buttonExplore, 'current')) {
              buttonExplore.current.click()
            }
          }}
          onDependency={event => {
            if (get(buttonDependency, 'current')) {
              buttonDependency.current.click()
            }
            event.preventDefault()
          }}
          onEscape={onEscape}
        />
      </Suspense>
      <SideLeft />
      <div id='main'>
        <Header />
        <hr className='divider' />
        <Form onSubmit={onSubmit}>
          {!complete ? (
            <Loading />
          ) : (
            <>
              <Fields
                onSubmit={onSubmit}
                onPush={onPush}
                onShare={onShare}
                onExplore={onExplore}
                refExplore={buttonExplore}
                refSubmit={buttonSubmit}
                refDependency={buttonDependency}
                generating={generating}
              />
              <DependencyDialog onClose={onEscape} />
            </>
          )}
        </Form>
      </div>
      <SideRight />
      <Suspense fallback=''>
        <Share open={shareOpen || false} shareUrl={share} onClose={onEscape} />
        <Explore
          projectName={`${get(values, 'meta.artifact')}.zip`}
          blob={blob}
          open={exploreOpen || false}
          onClose={onEscape}
        />
      </Suspense>
    </>
  )
}
