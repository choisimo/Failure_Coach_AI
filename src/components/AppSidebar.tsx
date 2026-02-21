import { Plus } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";
import { Button } from "./ui/button";
import { ConversationList, Conversation, ConversationWorkspace } from "./ConversationList";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useSettingsStore } from "@/hooks/useSettingsStore";
import { cn } from "@/lib/utils";
import {
  DialogOrbitIcon,
  InsightPrismIcon,
  MindMirrorMark,
  PromptCircuitIcon,
} from "@/components/icons/AgenticIcons";

interface AppSidebarProps {
  conversations: Conversation[];
  workspaces?: ConversationWorkspace[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onNewConversation: () => void;
  onCreateWorkspace?: (conversationIds: string[]) => void;
  onMoveToWorkspace?: (conversationIds: string[], workspaceId: string | null) => void;
  onToggleWorkspace?: (workspaceId: string) => void;
  onRenameWorkspace?: (workspaceId: string, name: string) => void;
  onDeleteWorkspace?: (workspaceId: string) => void;
}

export const AppSidebar = ({
  conversations,
  workspaces,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  onCreateWorkspace,
  onMoveToWorkspace,
  onToggleWorkspace,
  onRenameWorkspace,
  onDeleteWorkspace,
}: AppSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { irlEnabled, irlPolicyVersion, setIrlEnabled, setIrlPolicyVersion } = useSettingsStore();

  return (
    <Sidebar className={collapsed ? "w-14" : "w-72"} collapsible="icon">
      <SidebarHeader className="h-[4.75rem] justify-center border-b border-sidebar-border px-4 py-0">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/[0.15]"
            aria-hidden="true"
          >
            <MindMirrorMark className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-foreground truncate">마음 거울</h1>
              <p className="text-xs text-muted-foreground truncate">당신의 성찰 동반자</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col">
        <SidebarGroup className="px-2 py-3">
          <SidebarGroupLabel className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            메뉴
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                        isActive 
                          ? "bg-primary/[0.12] text-primary font-medium" 
                          : "text-foreground/80 hover:bg-sidebar-accent hover:text-foreground"
                      )
                    }
                  >
                    <DialogOrbitIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    {!collapsed && <span>대화</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/insights"
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                        isActive 
                          ? "bg-primary/[0.12] text-primary font-medium" 
                          : "text-foreground/80 hover:bg-sidebar-accent hover:text-foreground"
                      )
                    }
                  >
                    <InsightPrismIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    {!collapsed && <span>나의 통찰</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/prompt-studio"
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                        isActive 
                          ? "bg-accent/[0.12] text-accent font-medium" 
                          : "text-foreground/80 hover:bg-sidebar-accent hover:text-foreground"
                      )
                    }
                  >
                    <PromptCircuitIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    {!collapsed && <span>프롬프트 스튜디오</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <SidebarGroup className="flex-1 min-h-0 px-2 py-2">
            <SidebarGroupLabel className="px-3 mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              대화 기록
            </SidebarGroupLabel>
            <SidebarGroupContent className="h-full overflow-hidden">
              <ConversationList
                conversations={conversations}
                workspaces={workspaces}
                activeId={activeConversationId}
                onSelect={onSelectConversation}
                onDelete={onDeleteConversation}
                onCreateWorkspace={onCreateWorkspace}
                onMoveToWorkspace={onMoveToWorkspace}
                onToggleWorkspace={onToggleWorkspace}
                onRenameWorkspace={onRenameWorkspace}
                onDeleteWorkspace={onDeleteWorkspace}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {!collapsed && (
          <SidebarGroup className="px-2 py-3 border-t border-sidebar-border">
            <SidebarGroupLabel className="px-3 mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              설정
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-3 space-y-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1 mr-3">
                  <p className="text-sm font-medium text-foreground">전문가 가이드</p>
                  <p className="text-xs text-muted-foreground truncate">IRL로 응답 재랭킹</p>
                </div>
                <Switch 
                  checked={irlEnabled} 
                  onCheckedChange={setIrlEnabled}
                  aria-label="전문가 가이드 활성화"
                />
              </div>
              <div className="space-y-2">
                <label 
                  htmlFor="policy-version-select"
                  className="text-xs text-muted-foreground block"
                >
                  정책 버전
                </label>
                <Select 
                  value={irlPolicyVersion} 
                  onValueChange={setIrlPolicyVersion} 
                  disabled={!irlEnabled}
                >
                  <SelectTrigger id="policy-version-select" className="h-9">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">자동</SelectItem>
                    <SelectItem value="v1">v1</SelectItem>
                    <SelectItem value="v2">v2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {!collapsed && (
          <div className="p-3 border-t border-sidebar-border mt-auto">
            <Button 
              onClick={onNewConversation} 
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              새 대화 시작
            </Button>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};
