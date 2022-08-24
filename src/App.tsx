import './App.css';
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import Home from './pages/Home';
import Identities from './pages/Identities';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Home />} />
        <Route path='/identities' element={<Identities />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
