import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PromptCategory = "persona" | "strategy" | "followup" | "custom";

export interface PromptBlock {
  id: string;
  name: string;
  description?: string;
  category: PromptCategory;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  source?: "manual" | "file";
  fileName?: string;
}

export const PROMPT_CATEGORY_OPTIONS: {
  value: PromptCategory;
  label: string;
  helper: string;
}[] = [
  {
    value: "persona",
    label: "페르소나",
    helper: "AI가 대화에서 어떤 역할과 톤을 유지할지 정의합니다.",
  },
  {
    value: "strategy",
    label: "전략",
    helper: "질문 방식이나 개입 전략을 설정합니다.",
  },
  {
    value: "followup",
    label: "후속 액션",
    helper: "마무리 가이드나 실천 유도를 위한 문장을 담습니다.",
  },
  {
    value: "custom",
    label: "커스텀",
    helper: "특정 상황용 추가 지침을 자유롭게 구성합니다.",
  },
];

const now = () => new Date().toISOString();

const createBlock = (
  name: string,
  category: PromptCategory,
  content: string,
  description?: string,
  tags: string[] = []
): PromptBlock => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `prompt-${Math.random().toString(36).slice(2)}`,
  name,
  category,
  content,
  description,
  tags,
  createdAt: now(),
  updatedAt: now(),
  source: "manual",
});

const defaultBlocks: PromptBlock[] = [
  createBlock(
    "기본 마음 거울 페르소나",
    "persona",
    `당신은 깊은 공감 능력과 안정감을 주는 코치입니다.
- 사용자의 감정을 세심하게 반영하며 비판 없이 수용합니다.
- 사용자가 스스로 답을 찾을 수 있도록 열린 질문을 활용합니다.
- 속도보다 깊이를 중시하며 충분한 여백을 제공합니다.`,
    "감정 안전성을 최우선하는 기본 역할"
  ),
  createBlock(
    "성찰 질문 흐름",
    "strategy",
    `다음 질문 구조를 바탕으로 대화를 이끕니다.
1. 경험을 구체적으로 묻기
2. 감정과 욕구 알아차리기
3. 의미 찾기
4. 앞으로의 시도 설계하기

활용 예시:
- 그때 어떤 상황이었는지 조금 더 들려주실 수 있을까요?
- 그 경험이 지금의 당신에게 어떤 의미로 남아 있나요?
- 다음에 비슷한 상황을 맞닥뜨린다면 무엇을 해보고 싶으신가요?`
  ),
  createBlock(
    "실행 촉진 힌트",
    "followup",
    `대화 후반부나 사용자가 정리하고 싶어 할 때 활용합니다.
- 오늘 나눈 이야기를 기억하기 위해 어떤 기록을 남기고 싶으신가요?
- 지금 떠오르는 작은 실험이 있다면 무엇인가요?
- 다음 대화까지 스스로 챙기고 싶은 것이 있다면 적어볼까요?`
  ),
];

const defaultActivePerCategory: Partial<Record<PromptCategory, string | null>> = {
  persona: defaultBlocks.find((b) => b.category === "persona")?.id ?? null,
  strategy: defaultBlocks.find((b) => b.category === "strategy")?.id ?? null,
  followup: defaultBlocks.find((b) => b.category === "followup")?.id ?? null,
  custom: null,
};

type PromptUpdate = Partial<Omit<PromptBlock, "id" | "createdAt" | "source" | "fileName" | "category">> & {
  category?: PromptCategory;
  source?: PromptBlock["source"];
  fileName?: string;
};

export interface PromptComposerSection {
  id: string;
  category: PromptCategory;
  blockId: string | null;
  weight: number;
}

export interface PromptComposition {
  sections: PromptComposerSection[];
  prompt: string;
  orderedBlocks: PromptBlock[];
}

const defaultComposerSections = (
  activeMap: Partial<Record<PromptCategory, string | null>> = defaultActivePerCategory
): PromptComposerSection[] => [
  {
    id: `composer-persona`,
    category: "persona",
    blockId: activeMap.persona ?? null,
    weight: 1.5,
  },
  {
    id: `composer-strategy`,
    category: "strategy",
    blockId: activeMap.strategy ?? null,
    weight: 1,
  },
  {
    id: `composer-followup`,
    category: "followup",
    blockId: activeMap.followup ?? null,
    weight: 0.6,
  },
];

export interface PromptState {
  blocks: PromptBlock[];
  activePerCategory: Partial<Record<PromptCategory, string | null>>;
  composerSections: PromptComposerSection[];
  scratchpad: string;
  addBlock: (data: {
    name: string;
    category: PromptCategory;
    content: string;
    description?: string;
    tags?: string[];
    source?: PromptBlock["source"];
    fileName?: string;
  }) => string;
  updateBlock: (id: string, data: PromptUpdate) => void;
  deleteBlock: (id: string) => void;
  setActiveForCategory: (category: PromptCategory, blockId: string | null) => void;
  importBlocks: (items: { name: string; content: string; category?: PromptCategory }[]) => string[];
  setComposerSections: (sections: PromptComposerSection[]) => void;
  resetComposerSections: () => void;
  setScratchpad: (content: string) => void;
  composePrompt: () => PromptComposition;
}

export const usePromptStore = create<PromptState>()(
  persist(
    (set, get) => ({
      blocks: defaultBlocks,
      activePerCategory: defaultActivePerCategory,
      composerSections: defaultComposerSections(defaultActivePerCategory),
      scratchpad: "",

      addBlock: ({ name, category, content, description, tags = [], source = "manual", fileName }) => {
        const block: PromptBlock = {
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `prompt-${Math.random().toString(36).slice(2)}`,
          name,
          category,
          content,
          description,
          tags,
          createdAt: now(),
          updatedAt: now(),
          source,
          fileName,
        };

        set((state) => {
          const nextBlocks = [block, ...state.blocks];
          const nextActive = { ...state.activePerCategory };
          if (!nextActive[category]) {
            nextActive[category] = block.id;
          }

          const nextComposer = state.composerSections.map((section) =>
            section.category === category && section.blockId == null
              ? { ...section, blockId: block.id }
              : section
          );

          return {
            blocks: nextBlocks,
            activePerCategory: nextActive,
            composerSections: nextComposer,
          };
        });

        return block.id;
      },

      updateBlock: (id, data) => {
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id
              ? {
                  ...block,
                  ...data,
                  category: data.category ?? block.category,
                  tags: data.tags ?? block.tags,
                  updatedAt: now(),
                  source: data.source ?? block.source,
                  fileName: data.fileName ?? block.fileName,
                }
              : block
          ),
        }));
      },

      deleteBlock: (id) => {
        set((state) => {
          const blockToDelete = state.blocks.find((block) => block.id === id);
          if (!blockToDelete) return state;

          const nextBlocks = state.blocks.filter((block) => block.id !== id);
          const nextActive = { ...state.activePerCategory };
          const nextComposer = state.composerSections.map((section) =>
            section.blockId === id ? { ...section, blockId: null } : section
          );

          if (nextActive[blockToDelete.category] === id) {
            nextActive[blockToDelete.category] = null;
          }

          return {
            blocks: nextBlocks,
            activePerCategory: nextActive,
            composerSections: nextComposer,
          };
        });
      },

      setActiveForCategory: (category, blockId) => {
        set((state) => ({
          activePerCategory: {
            ...state.activePerCategory,
            [category]: blockId,
          },
          composerSections: state.composerSections.map((section) =>
            section.category === category && section.id.startsWith("composer-")
              ? { ...section, blockId }
              : section
          ),
        }));
      },

      importBlocks: (items) => {
        const createdIds: string[] = [];
        items.forEach(({ name, content, category = "custom" }) => {
          const trimmedContent = content.trim();
          if (!trimmedContent) return;
          const id = get().addBlock({
            name,
            category,
            content: trimmedContent,
            source: "file",
            fileName: name,
          });
          createdIds.push(id);
        });
        return createdIds;
      },

      setComposerSections: (sections) => {
        set(() => ({
          composerSections: sections,
        }));
      },

      resetComposerSections: () => {
        set((state) => ({
          composerSections: defaultComposerSections(state.activePerCategory),
        }));
      },

      setScratchpad: (content) => {
        set(() => ({
          scratchpad: content,
        }));
      },

      composePrompt: () => {
        const state = get();
        const orderedBlocks = state.composerSections
          .map((section) => state.blocks.find((block) => block.id === section.blockId) || null)
          .filter((block): block is PromptBlock => Boolean(block));

        const parts: string[] = orderedBlocks.map((block) => `### ${block.name}\n${block.content.trim()}`);

        const scratchpad = state.scratchpad.trim();
        if (scratchpad) {
          parts.push(`### 사용자 즉석 메모\n${scratchpad}`);
        }

        const prompt = parts.join("\n\n");

        return {
          sections: state.composerSections,
          prompt,
          orderedBlocks,
        };
      },
    }),
    {
      name: "prompt-storage",
    }
  )
);
