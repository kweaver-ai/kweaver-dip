import { Outlet } from 'react-router-dom'
import Container from './Container'

const GlobalLayout = () => {
  return (
    <Container>
      <Outlet />
    </Container>
  )
}

export default GlobalLayout
