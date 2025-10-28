import { useMemo, useState } from "react";
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
import { Upload, FileText, PlusCircle, Trash2, Pencil, Save, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";

interface PromptWorkspaceProps {
  onClose?: () => void;
}

const MAX_CONTENT_PREVIEW_LENGTH = 240;

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
  onDelete,
}: {
  block: PromptBlock;
  isActive?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) => {
  return (
    <Card className={cn("border-border/60 hover:border-primary/60 transition-colors", isActive && "border-primary")}> 
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
}: {
  sections: PromptComposerSection[];
  blocks: PromptBlock[];
  onChange: (sections: PromptComposerSection[]) => void;
  onGenerate: () => void;
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
    <Card className="border-primary/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>프롬프트 조합</CardTitle>
            <CardDescription>선택한 블록들을 순서대로 합쳐 하나의 프롬프트로 미리보기 합니다.</CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" /> {sections.filter((section) => section.blockId).length}개 선택됨
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid md:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-4">
          {sections.map((section) => {
            const block = blocks.find((b) => b.id === section.blockId);
            const categoryOption = PROMPT_CATEGORY_OPTIONS.find((option) => option.value === section.category);
            return (
              <div key={section.id} className="p-3 rounded-lg border border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-2">
                      {categoryOption?.label}
                      {categoryOption?.helper && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                              i
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="text-sm max-w-xs">
                            {categoryOption.helper}
                          </PopoverContent>
                        </Popover>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {block ? block.name : "선택 없음"}
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(section.blockId)}
                    onCheckedChange={(checked) =>
                      handleSelectBlock(section.id, checked ? activePerCategory?.[section.category] ?? null : null, section.category)
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>대체 블록 선택</Label>
                  <Select
                    value={section.blockId ?? "none"}
                    onValueChange={(value) => handleSelectBlock(section.id, value === "none" ? null : value, section.category)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="블록을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">선택 안함</SelectItem>
                      {blocks
                        .filter((block) => block.category === section.category)
                        .map((block) => (
                          <SelectItem key={block.id} value={block.id}>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{block.name}</span>
                              <span className="text-xs text-muted-foreground">
                                <ContentPreview content={block.content} />
                              </span>
                            </div>
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
                <PlusCircle className="h-4 w-4 mr-2" /> 추가 섹션 만들기
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새로운 조합 섹션</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  커스텀 블록을 추가하여 특정 상황에 맞는 지침을 조합할 수 있습니다.
                </p>
                <Command>
                  <CommandGroup heading="카테고리 선택">
                    {PROMPT_CATEGORY_OPTIONS.map((option) => (
                      <CommandItem
                        key={option.value}
                        onSelect={() => {
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
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="p-4 rounded-lg border border-border/60 bg-card">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">전체 프롬프트 미리보기</h4>
            <Button size="sm" variant="outline" onClick={onGenerate}>
              복사하기
            </Button>
          </div>
          <ScrollArea className="max-h-[480px]">
            <pre className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
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

    const exportData = {
      generatedAt: new Date().toISOString(),
      sections: sections.map((section) => ({
        category: section.category,
        blockId: section.blockId,
      })),
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

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
          blocks?: { name: string; content: string; category?: PromptCategory }[];
          sections?: { category: PromptCategory; blockId: string | null }[];
          prompt?: string;
        };

        if (data.blocks?.length) {
          data.blocks.forEach((block) =>
            addBlock({
              ...block,
              category: block.category ?? "custom",
              source: "file",
              fileName: file.name,
            })
          );
        }

        if (data.sections) {
          const importedSections = data.sections.map((section, index) => ({
            id: `${section.category}-${Date.now()}-${index}`,
            category: section.category,
            blockId: section.blockId,
            weight: 1,
          }));
          setComposerSections(importedSections);
        }

        toast({
          title: "가져오기 완료",
          description: "JSON 파일에서 프롬프트 구성이 불러와졌습니다.",
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

  const filteredBlocks = useMemo(() => {
    const grouped: Record<PromptCategory, PromptBlock[]> = {
      persona: [],
      strategy: [],
      followup: [],
      custom: [],
    };

    blocks.forEach((block) => {
      grouped[block.category].push(block);
    });

    return grouped;
  }, [blocks]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">프롬프트 워크스페이스</h2>
          <p className="text-sm text-muted-foreground">
            페르소나, 전략, 후속 액션 등 블록을 조합해 상황별로 맞춤 프롬프트를 구성하세요.
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PromptCategory | "composer") }>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="composer">프롬프트 조합</TabsTrigger>
          {PROMPT_CATEGORY_OPTIONS.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
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
          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              전환 시점에 맞춰 활성화할 프롬프트 블록을 빠르게 조합할 수 있습니다.
            </div>
            <div className="flex gap-2">
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
