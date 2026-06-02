import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Check, LayoutDashboard } from 'lucide-react'
import { useDashboard } from '@/store/dashboard'
import { WidgetPicker } from './WidgetPicker'
import { ThemePicker } from './ThemePicker'

export function EditBar() {
  const { editMode, toggleEditMode } = useDashboard()
  const [pickerOpen, setPickerOpen] = useState(false)

  if (!editMode) {
    return (
      <button
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        onClick={toggleEditMode}
        title="Edit dashboard"
      >
        <LayoutDashboard className="h-5 w-5" />
      </button>
    )
  }

  return (
    <>
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b px-4 py-2 flex items-center gap-2">
        <Button size="sm" onClick={() => setPickerOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Widget
        </Button>
        <ThemePicker />
        <div className="ml-auto">
          <Button size="sm" onClick={toggleEditMode}>
            <Check className="h-4 w-4 mr-1" /> Done
          </Button>
        </div>
      </div>
      <WidgetPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  )
}
