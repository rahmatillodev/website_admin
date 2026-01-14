import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import userStore from '@/stores/usersStore'
import Sidebar from './sidebar/Sidebar';

export default function Layout() {
  const { pageSize, fetchUsers } = userStore();
  
  useEffect(() => {
    fetchUsers(1, pageSize);
  }, []);
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* <Header /> */}
        <main className="flex-1 overflow-y-auto bg-background-light">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

