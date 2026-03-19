"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { authApi, profileApi, documentsApi, type UserData, type DocumentRecord } from "@/lib/api"

export interface StudentData {
  id: string
  email: string
  name: string
  university: string
  major: string
  degree: string
  year: number
  visaStatus: string
  documents: DocumentFile[]
}

export interface DocumentFile {
  id: string
  name: string
  type: string
  uploadedAt: string
  dataUrl?: string
}

export interface AddDocumentPayload {
  name: string
  doc_type: string
  file_data: string
  file_size: number
}

function mapUser(user: UserData, docs: DocumentRecord[]): StudentData {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? "",
    university: user.university ?? "",
    major: user.major ?? "",
    degree: user.degree_level ?? "Bachelor",
    year: parseInt(user.year_of_study ?? "1") || 1,
    visaStatus: user.visa_status ?? "F-1",
    documents: docs.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.doc_type,
      uploadedAt: new Date(d.uploaded_at).toLocaleDateString(),
      dataUrl: d.file_data,
    })),
  }
}

interface AuthContextType {
  student: StudentData | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => void
  updateProfile: (data: Partial<StudentData>) => Promise<void>
  addDocument: (payload: AddDocumentPayload) => Promise<void>
  removeDocument: (documentId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<StudentData | null>(null)

  // Restore session from stored token
  useEffect(() => {
    const token = localStorage.getItem("f1_token")
    if (!token) return
    Promise.all([authApi.me(), documentsApi.list()])
      .then(([user, { documents }]) => setStudent(mapUser(user, documents)))
      .catch(() => localStorage.removeItem("f1_token"))
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { token, user } = await authApi.login(email, password)
      localStorage.setItem("f1_token", token)
      const { documents } = await documentsApi.list()
      setStudent(mapUser(user, documents))
      return true
    } catch {
      return false
    }
  }

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const { token, user } = await authApi.signup(email, password, name)
      localStorage.setItem("f1_token", token)
      setStudent(mapUser(user, []))
      return true
    } catch {
      return false
    }
  }

  const logout = () => {
    setStudent(null)
    localStorage.removeItem("f1_token")
  }

  const updateProfile = async (data: Partial<StudentData>) => {
    const updated = await profileApi.update({
      name: data.name,
      university: data.university,
      major: data.major,
      degree_level: data.degree,
      year_of_study: data.year != null ? String(data.year) : undefined,
      visa_status: data.visaStatus,
    })
    if (student) {
      setStudent({
        ...student,
        name: updated.name ?? student.name,
        university: updated.university ?? student.university,
        major: updated.major ?? student.major,
        degree: updated.degree_level ?? student.degree,
        year: parseInt(updated.year_of_study ?? String(student.year)) || student.year,
        visaStatus: updated.visa_status ?? student.visaStatus,
      })
    }
  }

  const addDocument = async (payload: AddDocumentPayload) => {
    const doc = await documentsApi.upload(payload)
    if (student) {
      const newFile: DocumentFile = {
        id: doc.id,
        name: doc.name,
        type: doc.doc_type,
        uploadedAt: new Date(doc.uploaded_at).toLocaleDateString(),
        dataUrl: doc.file_data,
      }
      setStudent({ ...student, documents: [...student.documents, newFile] })
    }
  }

  const removeDocument = async (documentId: string) => {
    await documentsApi.delete(documentId)
    if (student) {
      setStudent({
        ...student,
        documents: student.documents.filter((d) => d.id !== documentId),
      })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        student,
        isAuthenticated: !!student,
        login,
        signup,
        logout,
        updateProfile,
        addDocument,
        removeDocument,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
