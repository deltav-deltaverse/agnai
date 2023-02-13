import { Component, lazy } from 'solid-js'
import { Route, Routes } from '@solidjs/router'
import NavBar from './shared/NavBar'

const App: Component = () => (
  <div class="flex h-[100vh] flex-col justify-between">
    <NavBar />
    <div class="w-full grow overflow-y-scroll px-8 pt-8 max-sm:px-3">
      <div class="mx-auto h-full max-w-4xl">
        <Routes>
          <Route path="/chat" component={lazy(() => import('./pages/Chat'))} />
          <Route path="/character" component={lazy(() => import('./pages/CharacterSettings'))} />
          <Route path="/" component={lazy(() => import('./pages/Home'))} />
          <Route path="/account/login" component={lazy(() => import('./pages/Login'))} />
        </Routes>
      </div>
    </div>
  </div>
)

export default App
