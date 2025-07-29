import { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from "@/components/ui/sonner"
import { AnimatePresence } from 'framer-motion'
import { StudentProvider } from './context/StudentContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Measurements from './pages/Measurements'
import Calculations from './pages/Calculations'
import Workouts from './pages/Workouts'
import Nutrition from './pages/Nutrition'
import Ebooks from './pages/Ebooks'
import AirtableConfig from './pages/AirtableConfig'
import AdminStudents from './pages/admin/AdminStudents'
import AdminStats from './pages/admin/AdminStats'
import AdminNutritionalCalculations from './pages/admin/AdminNutritionalCalculations'
import StudentStats from './pages/admin/StudentStats'
import StudentCalculations from './pages/admin/StudentCalculations'
import StudentWorkouts from './pages/admin/StudentWorkouts'
import StudentNutrition from './pages/admin/StudentNutrition'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Router>
      <StudentProvider>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/measurements" element={<Measurements />} />
            <Route path="/calculations" element={<Calculations />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/ebooks" element={<Ebooks />} />
            <Route path="/airtable-config" element={<AirtableConfig />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/stats" element={<AdminStats />} />
            <Route path="/admin/nutritional-calculations" element={<AdminNutritionalCalculations />} />
            <Route path="/admin/student-stats" element={<StudentStats />} />
            <Route path="/admin/student-calculations" element={<StudentCalculations />} />
            <Route path="/admin/student-workouts" element={<StudentWorkouts />} />
            <Route path="/admin/student-nutrition" element={<StudentNutrition />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
        <Toaster position="bottom-right" />
      </StudentProvider>
    </Router>
  )
}

export default App