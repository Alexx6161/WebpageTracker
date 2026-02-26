import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './components/Dashboard';
import ReviewChanges from './components/ReviewChanges';
import AddUrls from './components/AddUrls';
import ManageUrls from './components/ManageUrls';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="review" element={<ReviewChanges />} />
          <Route path="add" element={<AddUrls />} />
          <Route path="manage" element={<ManageUrls />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
