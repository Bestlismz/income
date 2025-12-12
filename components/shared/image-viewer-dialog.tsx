"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import Image from "next/image"

interface ImageViewerDialogProps {
  imageUrl: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImageViewerDialog({ imageUrl, open, onOpenChange }: ImageViewerDialogProps) {
  if (!imageUrl) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">Receipt Image</DialogTitle>
        <div className="relative w-full h-[80vh] bg-black">
          <Image
            src={imageUrl}
            alt="Receipt"
            fill
            className="object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
