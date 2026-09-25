import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import AddProject from "./pages/AddProject";
import Chat from "./pages/Chat";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add-project" element={<AddProject />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
