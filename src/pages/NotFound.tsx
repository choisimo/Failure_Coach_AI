import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background text-foreground p-8">
      <div className="w-20 h-20 rounded-2xl bg-muted/40 flex items-center justify-center">
        <span className="text-4xl font-bold text-muted-foreground">404</span>
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-muted-foreground">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
      </div>
      <Button onClick={() => navigate("/")} className="gap-2">
        <Home className="h-4 w-4" />
        홈으로 돌아가기
      </Button>
    </div>
  );
};

export default NotFound;
