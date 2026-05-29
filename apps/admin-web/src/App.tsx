import type { ReactElement } from 'react'
import { CreateFest } from './pages/CreateFest'
import { DFestCurrent } from './pages/DFestCurrent'
import { DManageBooth } from './pages/DManageBooth'
import { DManageAuth } from './pages/DManageAuth'
import { DManageQR } from './pages/DManageQR'
import { DReport } from './pages/DReport'
import { DSetting } from './pages/DSetting'
import { LoginAdmin } from './pages/LoginAdmin'
import { ManagePass } from './pages/ManagePass'
import { SetPass } from './pages/SetPass'
import { SubmitInfo } from './pages/SubmitInfo'
import { WaitVC } from './pages/WaitVC'

const routes = new Map<string, { title: string; element: ReactElement }>([
  ['/loginAdmin', { title: 'loginAdmin', element: <LoginAdmin /> }],
  ['/submitInfo', { title: 'submitInfo', element: <SubmitInfo /> }],
  ['/waitVC', { title: 'waitVC', element: <WaitVC /> }],
  ['/createFest', { title: 'createFest', element: <CreateFest /> }],
  ['/managePass', { title: 'managePass', element: <ManagePass /> }],
  ['/setPass', { title: 'setPass', element: <SetPass /> }],
  ['/dFestCurrent', { title: 'dFestCurrent', element: <DFestCurrent /> }],
  ['/dmanageQR', { title: 'dmanageQR', element: <DManageQR /> }],
  ['/dmanageBooth', { title: 'dmanageBooth', element: <DManageBooth /> }],
  ['/dmanageAuth', { title: 'dmanageAuth', element: <DManageAuth /> }],
  ['/dReport', { title: 'dReport', element: <DReport /> }],
  ['/dSetting', { title: 'dSetting', element: <DSetting /> }]
])

export function App() {
  const path = window.location.pathname === '/' ? '/loginAdmin' : window.location.pathname
  return routes.get(path)?.element ?? <LoginAdmin />
}
