import { ChangeEvent, useMemo, useState } from "react";
import {
  PROMPT_CATEGORY_OPTIONS,
  PromptBlock,
  PromptCategory,
  PromptComposerSection,
  usePromptStore,
} from "@/hooks/usePromptStore";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, PlusCircle, Trash2, Pencil, Save, Layers, ArrowDown, ArrowUp, Search, CopyPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useChatStore } from "@/hooks/useChatStore";
import { useNavigate } from "react-router-dom";
import { FlowBranchIcon, PromptCircuitIcon } from "@/components/icons/AgenticIcons";

interface PromptWorkspaceProps {
  onClose?: () => void;
}

const MAX_CONTENT_PREVIEW_LENGTH = 240;
const BLOCK_SORT_OPTIONS = [
  { value: "recent", label: "최근 수정 순" },
  { value: "created", label: "생성 순" },
  { value: "name", label: "이름순" },
] as const;

type BlockSortMode = (typeof BLOCK_SORT_OPTIONS)[number]["value"];

const PROMPT_CATEGORY_SET = new Set<PromptCategory>(
  PROMPT_CATEGORY_OPTIONS.map((option) => option.value)
);

const isPromptCategory = (value: unknown): value is PromptCategory =>
  typeof value === "string" && PROMPT_CATEGORY_SET.has(value as PromptCategory);

const ContentPreview = ({ content }: { content: string }) => {
  const trimmed = content.trim();
  if (!trimmed) return <span className="text-muted-foreground/60">내용이 없습니다.</span>;
  if (trimmed.length <= MAX_CONTENT_PREVIEW_LENGTH) {
    return <span className="whitespace-pre-line text-sm text-muted-foreground">{trimmed}</span>;
  }
  return (
    <span className="whitespace-pre-line text-sm text-muted-foreground">
      {trimmed.slice(0, MAX_CONTENT_PREVIEW_LENGTH)}...
    </span>
  );
};

const BlockCard = ({
  block,
  isActive,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  block: PromptBlock;
  isActive?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}) => {
  return (
    <Card
      className={cn(
        "border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-sm",
        isActive && "border-primary/70 shadow-sm"
      )}
    >
      <CardHeader className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">{block.name}</CardTitle>
            {block.description && (
              <CardDescription className="text-xs text-muted-foreground">
                {block.description}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1">
            {block.source === "file" && <Badge variant="outline">파일</Badge>}
            {block.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-md bg-muted/40 border border-border/40">
          <ContentPreview content={block.content} />
        </div>
        <div className="flex justify-between items-center">
          <Button variant={isActive ? "default" : "secondary"} size="sm" onClick={onSelect}>
            {isActive ? "활성화됨" : "조합에 추가"}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDuplicate}>
              <CopyPlus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PromptEditor = ({
  block,
  onSave,
  onCancel,
}: {
  block?: PromptBlock;
  onSave: (data: {
    name: string;
    category: PromptCategory;
    description?: string;
    content: string;
    tags?: string[];
  }) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState(block?.name ?? "");
  const [category, setCategory] = useState<PromptCategory>(block?.category ?? "custom");
  const [description, setDescription] = useState(block?.description ?? "");
  const [tags, setTags] = useState<string>(block?.tags.join(", ") ?? "");
  const [content, setContent] = useState(block?.content ?? "");

  const handleSave = () => {
    if (!name.trim() || !content.trim()) return;
    onSave({
      name: name.trim(),
      category,
      description: description.trim() || undefined,
      content: content.trim(),
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="prompt-name">프롬프트 이름</Label>
        <Input
          id="prompt-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 심층 감정 탐색"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="prompt-category">카테고리</Label>
        <Select value={category} onValueChange={(value) => setCategory(value as PromptCategory)}>
          <SelectTrigger id="prompt-category">
            <SelectValue placeholder="카테고리를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {PROMPT_CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.helper}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="prompt-description">설명 (선택)</Label>
        <Input
          id="prompt-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="사용 목적이나 활용 상황을 기록하세요"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="prompt-tags">태그 (쉼표로 구분)</Label>
        <Input
          id="prompt-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="감정, 회복, 실행"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="prompt-content">본문</Label>
        <Textarea
          id="prompt-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="AI에게 전달할 지침을 작성하세요"
          className="min-h-[240px]"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          취소
        </Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" /> 저장
        </Button>
      </div>
    </div>
  );
};

const PromptComposer = ({
  sections,
  blocks,
  onChange,
  onGenerate,
  onApplyToChat,
}: {
  sections: PromptComposerSection[];
  blocks: PromptBlock[];
  onChange: (sections: PromptComposerSection[]) => void;
  onGenerate: () => void;
  onApplyToChat: () => void;
}) => {
  const { activePerCategory, setActiveForCategory } = usePromptStore();

  const handleSelectBlock = (sectionId: string, blockId: string | null, category: PromptCategory) => {
    const updated = sections.map((section) =>
      section.id === sectionId
        ? {
            ...section,
            blockId,
          }
        : section
    );
    onChange(updated);
    setActiveForCategory(category, blockId);
  };

  const handleMoveSection = (sectionId: string, direction: "up" | "down") => {
    const currentIndex = sections.findIndex((section) => section.id === sectionId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const reordered = [...sections];
    const [moved] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    onChange(reordered);
  };

  const handleRemoveSection = (sectionId: string) => {
    if (sections.length <= 1) return;
    onChange(sections.filter((section) => section.id !== sectionId));
  };

  const compositePrompt = useMemo(() => {
    const composition = sections
      .map((section) => {
        if (!section.blockId) return null;
        const block = blocks.find((b) => b.id === section.blockId);
        if (!block) return null;
        return `### ${block.name}\n${block.content.trim()}`;
      })
      .filter(Boolean)
      .join("\n\n");

    return composition || "선택된 프롬프트가 없습니다. 좌측에서 조합할 요소를 선택하세요.";
  }, [sections, blocks]);

  return (
    <Card className="border-primary/40 bg-card/95">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <PromptCircuitIcon className="h-5 w-5 text-primary" />
              프롬프트 조합
            </CardTitle>
            <CardDescription>선택한 블록들을 순서대로 합쳐 하나의 프롬프트로 미리보기 합니다.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1 self-start shrink-0 whitespace-nowrap">
              <Layers className="h-3.5 w-3.5" /> {sections.filter((section) => section.blockId).length}개 선택됨
            </Badge>
            <Button size="sm" variant="outline" onClick={onGenerate}>
              복사하기
            </Button>
            <Button size="sm" className="gap-2" onClick={onApplyToChat}>
              <PromptCircuitIcon className="h-4 w-4" />
              이 설정으로 대화 시작
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(18rem,21rem)_minmax(0,1fr)]">
        <div className="space-y-4">
          {sections.map((section, index) => {
            const block = blocks.find((b) => b.id === section.blockId);
            const categoryOption = PROMPT_CATEGORY_OPTIONS.find((option) => option.value === section.category);
            const isBaseSection = section.id.startsWith("composer-");

            return (
              <div key={section.id} className="space-y-3 rounded-lg border border-border/60 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <FlowBranchIcon className="h-3.5 w-3.5 text-primary/80" />
                      {categoryOption?.label}
                      {categoryOption?.helper && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                              i
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="max-w-xs text-sm">{categoryOption.helper}</PopoverContent>
                        </Popover>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground">순서 {index + 1}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{block ? block.name : "선택 없음"}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveSection(section.id, "up")}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMoveSection(section.id, "down")}
                      disabled={index === sections.length - 1}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    {!isBaseSection && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveSection(section.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Switch
                      checked={Boolean(section.blockId)}
                      onCheckedChange={(checked) =>
                        handleSelectBlock(
                          section.id,
                          checked ? activePerCategory?.[section.category] ?? null : null,
                          section.category
                        )
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>대체 블록 선택</Label>
                  <Select
                    value={section.blockId ?? "none"}
                    onValueChange={(value) =>
                      handleSelectBlock(section.id, value === "none" ? null : value, section.category)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="블록을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">선택 안함</SelectItem>
                      {blocks
                        .filter((entry) => entry.category === section.category)
                        .map((entry) => (
                          <SelectItem key={entry.id} value={entry.id}>
                            {entry.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
          <Separator />
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> 추가 섹션 만들기
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새로운 조합 섹션</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  커스텀 블록을 추가해 특정 상황에 맞는 지침을 더 유연하게 조합할 수 있습니다.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {PROMPT_CATEGORY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className="rounded-lg border border-border/70 bg-card px-3 py-2 text-left transition-all duration-200 hover:border-primary/50 hover:bg-primary/[0.08]"
                      onClick={() => {
                        onChange([
                          ...sections,
                          {
                            id: `${option.value}-${Date.now()}`,
                            category: option.value,
                            blockId: null,
                            weight: 1,
                          },
                        ]);
                      }}
                    >
                      <p className="text-sm font-medium text-foreground">{option.label}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{option.helper}</p>
                    </button>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="min-w-0 rounded-lg border border-border/60 bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-semibold">전체 프롬프트 미리보기</h4>
            <Badge variant="secondary" className="text-[10px]">
              LIVE
            </Badge>
          </div>
          <ScrollArea className="max-h-[480px]">
            <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
              {compositePrompt}
            </pre>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export const PromptWorkspace = ({ onClose }: PromptWorkspaceProps) => {
  const { toast } = useToast();
  const { addConversation, setActiveConversation } = useChatStore();
  const navigate = useNavigate();
  const {
    blocks,
    addBlock,
    updateBlock,
    deleteBlock,
    composerSections,
    setComposerSections,
    composePrompt,
    scratchpad,
    setScratchpad,
  } = usePromptStore();
  const [activeTab, setActiveTab] = useState<PromptCategory | "composer">("composer");
  const [blockSearchQuery, setBlockSearchQuery] = useState("");
  const [blockSortMode, setBlockSortMode] = useState<BlockSortMode>("recent");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const editingBlock = editingBlockId ? blocks.find((block) => block.id === editingBlockId) : undefined;

  const handleCreateBlock = () => {
    setEditingBlockId(null);
    setIsEditorOpen(true);
  };

  const handleEditBlock = (id: string) => {
    setEditingBlockId(id);
    setIsEditorOpen(true);
  };

  const handleDeleteBlock = (id: string) => {
    deleteBlock(id);
    toast({
      title: "삭제됨",
      description: "선택한 프롬프트가 삭제되었습니다.",
    });
  };

  const handleDuplicateBlock = (id: string) => {
    const source = blocks.find((block) => block.id === id);
    if (!source) return;

    addBlock({
      name: `${source.name} (사본)`,
      category: source.category,
      description: source.description,
      content: source.content,
      tags: source.tags,
      source: "manual",
    });
    toast({
      title: "복제 완료",
      description: "프롬프트 블록 사본이 생성되었습니다.",
    });
  };

  const handleSaveBlock = (data: {
    name: string;
    category: PromptCategory;
    description?: string;
    content: string;
    tags?: string[];
  }) => {
    if (editingBlock) {
      updateBlock(editingBlock.id, data);
      toast({
        title: "업데이트됨",
        description: "프롬프트가 수정되었습니다.",
      });
    } else {
      addBlock(data);
      toast({
        title: "추가됨",
        description: "새로운 프롬프트가 추가되었습니다.",
      });
    }
    setIsEditorOpen(false);
  };

  const handleClearAll = () => {
    const current = usePromptStore.getState().composerSections;
    const cleared = current.map((section) => ({ ...section, blockId: null }));
    setComposerSections(cleared);
  };

  const handleExport = () => {
    const { prompt, sections } = composePrompt();

    const selectedBlocks = Array.from(
      new Map(
        sections
          .map((section) =>
            section.blockId ? blocks.find((block) => block.id === section.blockId) ?? null : null
          )
          .filter((block): block is PromptBlock => Boolean(block))
          .map((block) => [block.id, block])
      ).values()
    );

    const exportData = {
      generatedAt: new Date().toISOString(),
      blocks: selectedBlocks.map((block) => ({
        id: block.id,
        name: block.name,
        category: block.category,
        description: block.description,
        content: block.content,
        tags: block.tags,
        source: block.source,
        fileName: block.fileName,
      })),
      sections: sections.map((section) => ({
        category: section.category,
        blockId: section.blockId,
      })),
      scratchpad,
      prompt,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `prompt-composition-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "내보내기 완료",
      description: "프롬프트 조합이 JSON 파일로 저장되었습니다.",
    });
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json") && !file.name.endsWith(".txt")) {
      toast({
        title: "지원하지 않는 형식",
        description: "JSON 또는 TXT 파일만 업로드할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    const text = await file.text();

    try {
      if (file.name.endsWith(".json")) {
        const data = JSON.parse(text) as {
          blocks?: {
            id?: string;
            name?: string;
            content?: string;
            category?: PromptCategory | string;
            description?: string;
            tags?: string[];
            source?: "manual" | "file";
            fileName?: string;
          }[];
          sections?: { category?: PromptCategory | string; blockId?: string | null }[];
          scratchpad?: string;
          prompt?: string;
        };

        const blockIdMap = new Map<string, string>();
        let importedBlockCount = 0;

        if (Array.isArray(data.blocks) && data.blocks.length > 0) {
          data.blocks.forEach((block) => {
            if (typeof block.name !== "string" || typeof block.content !== "string") return;

            const name = block.name.trim();
            const content = block.content.trim();
            if (!name || !content) return;

            const nextId = addBlock({
              name,
              category: isPromptCategory(block.category) ? block.category : "custom",
              description: typeof block.description === "string" ? block.description : undefined,
              content,
              tags: Array.isArray(block.tags)
                ? block.tags.filter((tag): tag is string => typeof tag === "string")
                : [],
              source: "file",
              fileName:
                typeof block.fileName === "string" && block.fileName.trim().length > 0
                  ? block.fileName
                  : file.name,
            });

            importedBlockCount += 1;
            if (typeof block.id === "string" && block.id.trim().length > 0) {
              blockIdMap.set(block.id, nextId);
            }
          });
        }

        if (Array.isArray(data.sections) && data.sections.length > 0) {
          const storeState = usePromptStore.getState();
          const importedSections = data.sections
            .map((section, index) => {
              if (!isPromptCategory(section.category)) return null;

              const sourceBlockId = typeof section.blockId === "string" ? section.blockId : null;
              const resolvedBlockId = sourceBlockId
                ? blockIdMap.get(sourceBlockId) ?? sourceBlockId
                : null;
              const hasResolvedBlock =
                resolvedBlockId != null &&
                storeState.blocks.some((block) => block.id === resolvedBlockId);

              return {
                id: `${section.category}-${Date.now()}-${index}`,
                category: section.category,
                blockId: hasResolvedBlock ? resolvedBlockId : null,
                weight: 1,
              };
            })
            .filter((section): section is PromptComposerSection => Boolean(section));

          if (importedSections.length > 0) {
            setComposerSections(importedSections);
          }
        }

        if (typeof data.scratchpad === "string") {
          setScratchpad(data.scratchpad);
        }

        toast({
          title: "가져오기 완료",
          description:
            importedBlockCount > 0
              ? `JSON 파일에서 프롬프트 구성이 불러와졌습니다. (${importedBlockCount}개 블록 추가)`
              : "JSON 파일에서 프롬프트 구성이 불러와졌습니다.",
        });
      } else {
        const importedBlocks = text
          .split(/\n{2,}/)
          .map((chunk) => chunk.trim())
          .filter(Boolean)
          .map((chunk, index) => ({
            name: `${file.name.replace(/\.[^.]+$/, "")}-${index + 1}`,
            content: chunk,
            category: "custom" as PromptCategory,
          }));

        if (importedBlocks.length === 0) {
          toast({
            title: "가져오기 실패",
            description: "유효한 프롬프트 콘텐츠를 찾을 수 없습니다.",
            variant: "destructive",
          });
          return;
        }

        importedBlocks.forEach((block) =>
          addBlock({
            ...block,
            source: "file",
            fileName: file.name,
          })
        );

        toast({
          title: "TXT 가져오기 완료",
          description: `${importedBlocks.length}개의 블록이 추가되었습니다.`,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "가져오기 실패",
        description: "파일 파싱 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      event.target.value = "";
    }
  };

  const handleGeneratePrompt = () => {
    const { prompt } = composePrompt();
    if (!prompt.trim()) {
      toast({
        title: "조합된 프롬프트가 없습니다",
        description: "좌측에서 사용할 블록을 선택해 주세요.",
        variant: "destructive",
      });
      return;
    }

    const copyToClipboard = async () => {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(prompt);
        } else {
          const temp = document.createElement("textarea");
          temp.value = prompt;
          temp.style.position = "fixed";
          temp.style.opacity = "0";
          document.body.appendChild(temp);
          temp.focus();
          temp.select();
          document.execCommand("copy");
          document.body.removeChild(temp);
        }
        toast({
          title: "복사 완료",
          description: "조합된 프롬프트가 클립보드에 복사되었습니다.",
        });
      } catch (error) {
        console.error(error);
        toast({
          title: "복사 실패",
          description: "브라우저에서 클립보드 접근이 허용되지 않았을 수 있습니다.",
          variant: "destructive",
        });
      }
    };

    void copyToClipboard();
  };

  const handleApplyToChat = () => {
    const { prompt } = composePrompt();
    if (!prompt.trim()) {
      toast({
        title: "적용할 프롬프트가 없습니다",
        description: "조합된 내용을 먼저 구성해 주세요.",
        variant: "destructive",
      });
      return;
    }

    const label = new Date().toLocaleDateString("ko-KR", {
      month: "numeric",
      day: "numeric",
    });

    const conversationId = addConversation({
      mode: "CUSTOM",
      customPrompt: prompt,
      personaTitle: `프롬프트 조합 (${label})`,
    });
    setActiveConversation(conversationId);
    navigate(`/chat/${conversationId}`);
    toast({
      title: "대화 세션 생성 완료",
      description: "프롬프트 조합이 시스템 프롬프트로 적용되었습니다.",
    });
    onClose?.();
  };

  const filteredBlocks = useMemo(() => {
    const normalizedQuery = blockSearchQuery.trim().toLowerCase();
    const grouped: Record<PromptCategory, PromptBlock[]> = {
      persona: [],
      strategy: [],
      followup: [],
      custom: [],
    };

    blocks.forEach((block) => {
      if (normalizedQuery) {
        const searchable = [block.name, block.description ?? "", block.tags.join(" "), block.content]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(normalizedQuery)) return;
      }
      grouped[block.category].push(block);
    });

    const compareByMode = (a: PromptBlock, b: PromptBlock) => {
      if (blockSortMode === "name") {
        return a.name.localeCompare(b.name, "ko");
      }
      if (blockSortMode === "created") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    };

    (Object.keys(grouped) as PromptCategory[]).forEach((category) => {
      grouped[category] = [...grouped[category]].sort(compareByMode);
    });

    return grouped;
  }, [blocks, blockSearchQuery, blockSortMode]);

  const visibleBlockCount = useMemo(
    () => Object.values(filteredBlocks).reduce((total, entries) => total + entries.length, 0),
    [filteredBlocks]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">프롬프트 워크스페이스</h2>
          <p className="text-sm text-muted-foreground mt-1">
            페르소나, 전략, 후속 액션 등 블록을 조합해 상황별로 맞춤 프롬프트를 구성하세요.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input id="prompt-import" type="file" accept=".json,.txt" className="hidden" onChange={handleImport} />
          <Button variant="outline" onClick={() => document.getElementById("prompt-import")?.click()}>
            <Upload className="h-4 w-4 mr-2" /> 가져오기
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <FileText className="h-4 w-4 mr-2" /> 내보내기
          </Button>
          <Button variant="secondary" onClick={handleCreateBlock}>
            <PlusCircle className="h-4 w-4 mr-2" /> 새 블록 작성
          </Button>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              닫기
            </Button>
          )}
        </div>
      </div>

      <Card className="border-border/60 bg-card/70">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={blockSearchQuery}
                onChange={(event) => setBlockSearchQuery(event.target.value)}
                placeholder="블록 이름, 태그, 본문으로 검색"
                className="pl-9"
              />
            </div>
            <Select value={blockSortMode} onValueChange={(value) => setBlockSortMode(value as BlockSortMode)}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="정렬 기준" />
              </SelectTrigger>
              <SelectContent>
                {BLOCK_SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>현재 표시 중인 블록 {visibleBlockCount}개</span>
            {blockSearchQuery && (
              <button
                type="button"
                className="font-medium text-primary/90 hover:text-primary"
                onClick={() => setBlockSearchQuery("")}
              >
                검색 초기화
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PromptCategory | "composer") }>
        <TabsList className="w-full justify-start overflow-x-auto pr-1 thin-scrollbar">
          <TabsTrigger value="composer" className="px-2 text-xs sm:px-3 sm:text-sm">
            프롬프트 조합
          </TabsTrigger>
          {PROMPT_CATEGORY_OPTIONS.map((option) => (
            <TabsTrigger key={option.value} value={option.value} className="px-2 text-xs sm:px-3 sm:text-sm">
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="composer" className="space-y-6">
          <PromptComposer
            sections={composerSections}
            blocks={blocks}
            onChange={(sections) => setComposerSections(sections)}
            onGenerate={handleGeneratePrompt}
            onApplyToChat={handleApplyToChat}
          />
          <Card className="border-border/60">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>즉석 프롬프트 메모</CardTitle>
                <CardDescription>
                  지금 대화 흐름에 맞춰 추가하고 싶은 지침을 자유롭게 작성하면 조합 프롬프트에 함께 포함됩니다.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setScratchpad("")}
                disabled={!scratchpad.trim()}
              >
                비우기
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={scratchpad}
                onChange={(event) => setScratchpad(event.target.value)}
                placeholder="예: 이번 주에는 실행 아이디어를 3가지 이상 도출하도록 유도하기"
                className="min-h-[160px]"
              />
              <p className="text-xs text-muted-foreground">
                이 메모는 조합된 프롬프트의 마지막에 "사용자 즉석 메모" 섹션으로 추가됩니다.
              </p>
            </CardContent>
          </Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              전환 시점에 맞춰 활성화할 프롬프트 블록을 빠르게 조합할 수 있습니다.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={handleClearAll}>
                전체 초기화
              </Button>
              <Button onClick={handleGeneratePrompt}>미리보기 복사</Button>
            </div>
          </div>
        </TabsContent>

        {PROMPT_CATEGORY_OPTIONS.map((option) => (
          <TabsContent key={option.value} value={option.value}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{option.label}</h3>
                  <p className="text-sm text-muted-foreground">{option.helper}</p>
                </div>
                <Button onClick={handleCreateBlock} size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" /> 새 블록 작성
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredBlocks[option.value].length === 0 ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    아직 {option.label} 블록이 없습니다. 새 블록을 작성해 보세요.
                  </div>
                ) : (
                  filteredBlocks[option.value].map((block) => (
                    <BlockCard
                      key={block.id}
                      block={block}
                      isActive={composerSections.some((section) => section.blockId === block.id)}
                      onSelect={() => {
                        const current = usePromptStore.getState().composerSections;
                        const updated = current.map((section) =>
                          section.category === block.category && !section.blockId
                            ? { ...section, blockId: block.id }
                            : section
                        );
                        setComposerSections(updated);
                        usePromptStore.getState().setActiveForCategory(block.category, block.id);
                      }}
                      onEdit={() => handleEditBlock(block.id)}
                      onDuplicate={() => handleDuplicateBlock(block.id)}
                      onDelete={() => handleDeleteBlock(block.id)}
                    />
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingBlock ? "프롬프트 수정" : "새로운 프롬프트 블록"}</DialogTitle>
          </DialogHeader>
          <PromptEditor block={editingBlock} onSave={handleSaveBlock} onCancel={() => setIsEditorOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
