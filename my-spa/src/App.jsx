import React from 'react';
import { Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

import Spices from './pages/Spices';
import SpiceForm from './pages/SpiceForm';

import Cards from './pages/Cards';
import CardForm from './pages/CardForm';

import Outlets from './pages/Outlets';
import OutletForm from './pages/OutletForm';

import Employees from './pages/Employees';
import EmployeeForm from './pages/EmployeeForm';

import Clients from './pages/Clients';

import Suppliers from './pages/Suppliers';
import SupplierForm from './pages/SupplierForm';
import SupplierSpices from './pages/SupplierSpices';

import NotFound from './pages/NotFound';

export default function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<Spices />} />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/profile"
                    element={(
                        <ProtectedRoute clientOnly>
                            <Profile />
                        </ProtectedRoute>
                    )}
                />
                <Route path="/logout" element={<Login />} />

                <Route path="/spices" element={<Spices />} />
                <Route
                    path="/spices/add"
                    element={(
                        <ProtectedRoute adminOnly>
                            <SpiceForm mode="create" />
                        </ProtectedRoute>
                    )}
                />
                <Route
                    path="/spices/edit/:id"
                    element={(
                        <ProtectedRoute adminOnly>
                            <SpiceForm mode="edit" />
                        </ProtectedRoute>
                    )}
                />

                <Route path="/cards" element={<Cards />} />
                <Route
                    path="/cards/new"
                    element={(
                        <ProtectedRoute adminOnly>
                            <CardForm mode="create" />
                        </ProtectedRoute>
                    )}
                />
                <Route
                    path="/cards/:id/edit"
                    element={(
                        <ProtectedRoute adminOnly>
                            <CardForm mode="edit" />
                        </ProtectedRoute>
                    )}
                />

                <Route path="/outlets" element={<Outlets />} />
                <Route
                    path="/outlets/new"
                    element={(
                        <ProtectedRoute adminOnly>
                            <OutletForm mode="create" />
                        </ProtectedRoute>
                    )}
                />
                <Route
                    path="/outlets/:id/edit"
                    element={(
                        <ProtectedRoute adminOnly>
                            <OutletForm mode="edit" />
                        </ProtectedRoute>
                    )}
                />

                <Route
                    path="/employees"
                    element={(
                        <ProtectedRoute adminOnly>
                            <Employees />
                        </ProtectedRoute>
                    )}
                />
                <Route
                    path="/employees/new"
                    element={(
                        <ProtectedRoute adminOnly>
                            <EmployeeForm mode="create" />
                        </ProtectedRoute>
                    )}
                />
                <Route
                    path="/employees/:id/edit"
                    element={(
                        <ProtectedRoute adminOnly>
                            <EmployeeForm mode="edit" />
                        </ProtectedRoute>
                    )}
                />

                <Route
                    path="/clients"
                    element={(
                        <ProtectedRoute adminOnly>
                            <Clients />
                        </ProtectedRoute>
                    )}
                />

                <Route
                    path="/suppliers"
                    element={(
                        <ProtectedRoute adminOnly>
                            <Suppliers />
                        </ProtectedRoute>
                    )}
                />
                <Route
                    path="/suppliers/new"
                    element={(
                        <ProtectedRoute adminOnly>
                            <SupplierForm mode="create" />
                        </ProtectedRoute>
                    )}
                />
                <Route
                    path="/suppliers/:id/edit"
                    element={(
                        <ProtectedRoute adminOnly>
                            <SupplierForm mode="edit" />
                        </ProtectedRoute>
                    )}
                />
                <Route
                    path="/suppliers/:id/spices"
                    element={(
                        <ProtectedRoute adminOnly>
                            <SupplierSpices />
                        </ProtectedRoute>
                    )}
                />

                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    );
}
