"use client"

import { useState } from "react"
import { useAuth } from "./auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Upload, Trash2, Download } from "lucide-react"
import { Input } from "@/components/ui/input"

const documentTypes = ["I-20", "Form-I-765", "EAD", "Passport", "Other"] as const

export function DocumentStorage() {
  const { student, addDocument, removeDocument } = useAuth()
  const [selectedType, setSelectedType] = useState<string>("I-20")
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (!file || !student) return

    const inputEl = e.currentTarget
    setIsUploading(true)

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const dataUrl = event.target?.result as string
        await addDocument({
          name: file.name,
          doc_type: selectedType,
          file_data: dataUrl,
          file_size: file.size,
        })
      } catch (error) {
        console.error("Error uploading file:", error)
      } finally {
        setIsUploading(false)
        inputEl.value = ""
      }
    }
    reader.readAsDataURL(file)
  }

  if (!student) return null

  return (
    <section className="py-2">
      <div className="mb-8">
        <h2 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
            <FileText className="h-5 w-5 text-accent" />
          </div>
          Document Storage
        </h2>
        <p className="mt-2 text-muted-foreground">
          Securely store and organize your immigration documents
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Card */}
        <Card className="border-border/50 p-6 lg:col-span-3">
          <h3 className="mb-4 text-lg font-semibold">Upload Documents</h3>
          
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Document Type</label>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as DocumentFile["type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Select File</label>
              <div className="relative">
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="hidden"
                  id="file-input"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <label
                  htmlFor="file-input"
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/50 px-6 py-8 transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground">PDF, DOC, JPG, PNG (max 10MB)</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Documents List */}
        {student.documents.length > 0 ? (
          student.documents.map((doc) => (
            <Card key={doc.id} className="border-border/50 p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex flex-1 items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-accent/10">
                    <FileText className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-sm">{doc.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-secondary px-2 py-0.5">{doc.type}</span>
                      <span>{doc.uploadedAt}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeDocument(doc.id)}
                  className="flex-shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {doc.dataUrl && (
                <a
                  href={doc.dataUrl}
                  download={doc.name}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <Download className="h-3 w-3" />
                  Download
                </a>
              )}
            </Card>
          ))
        ) : (
          <Card className="border-dashed border-border/50 p-8 text-center lg:col-span-3">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 font-medium">No documents uploaded yet</p>
            <p className="text-sm text-muted-foreground">Start by uploading your I-20, EAD, or other immigration documents</p>
          </Card>
        )}
      </div>
    </section>
  )
}
