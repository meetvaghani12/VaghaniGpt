import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select AI Model" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="gemini">Vaghani GPT</SelectItem>
        <SelectItem value="deepseek">DeepSeek</SelectItem>
        <SelectItem value="openai">OpenAI GPT-4.1</SelectItem>
      </SelectContent>
    </Select>
  )
} 