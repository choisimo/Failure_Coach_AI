import { Sparkles, Star, MessageSquare, Plus } from "lucide-react";
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
import { ConversationList, Conversation } from "./ConversationList";

interface AppSidebarProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export const AppSidebar = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: AppSidebarProps) => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-80"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-lg font-semibold glow-text">마음 거울</h2>
              <p className="text-xs text-muted-foreground">당신의 성찰 동반자</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wide text-muted-foreground/80">메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                      isActive ? "bg-sidebar-accent text-primary font-medium border-l-2 border-primary" : "hover:bg-sidebar-accent"
                    }
                  >
                    <MessageSquare className="h-4 w-4" />
                    {!collapsed && <span>대화</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/insights"
                    className={({ isActive }) =>
                      isActive ? "bg-sidebar-accent text-primary font-medium border-l-2 border-primary" : "hover:bg-sidebar-accent"
                    }
                  >
                    <Star className="h-4 w-4" />
                    {!collapsed && <span>나의 통찰</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <SidebarGroup className="flex-1">
            <SidebarGroupLabel className="text-xs uppercase tracking-wide text-muted-foreground/80">대화 기록</SidebarGroupLabel>
            <SidebarGroupContent className="h-full">
              <ConversationList
                conversations={conversations}
                activeId={activeConversationId}
                onSelect={onSelectConversation}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Sticky footer new chat button */}
        {!collapsed && (
          <div className="p-3 border-t border-sidebar-border sticky bottom-0 bg-sidebar">
            <Button onClick={onNewConversation} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" /> 새 대화 시작
            </Button>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};
