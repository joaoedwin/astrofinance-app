"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserNav = UserNav;
const avatar_1 = require("@/components/ui/avatar");
const button_1 = require("@/components/ui/button");
const dropdown_menu_1 = require("@/components/ui/dropdown-menu");
const lucide_react_1 = require("lucide-react");
const auth_context_1 = require("@/contexts/auth-context");
const react_1 = require("react");
const navigation_1 = require("next/navigation");
function UserNav() {
    const { user } = (0, auth_context_1.useAuthContext)();
    const router = (0, navigation_1.useRouter)();
    const fileInputRef = (0, react_1.useRef)(null);
    const handleAvatarClick = () => {
        if (!user) {
            router.push("/login");
            return;
        }
        fileInputRef.current?.click();
    };
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const formData = new FormData();
        formData.append("avatar", file);
        const res = await fetch("/api/upload-avatar", {
            method: "POST",
            body: formData,
        });
        if (res.ok) {
            window.location.reload();
        }
    };
    return (<dropdown_menu_1.DropdownMenu>
      <dropdown_menu_1.DropdownMenuTrigger asChild>
        <button_1.Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <avatar_1.Avatar className="h-8 w-8" onClick={handleAvatarClick}>
            <avatar_1.AvatarImage src={user?.image || "/placeholder.svg"} alt={user?.name || "Avatar"}/>
            <avatar_1.AvatarFallback>{user?.name ? user.name[0].toUpperCase() : "?"}</avatar_1.AvatarFallback>
          </avatar_1.Avatar>
          <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileChange}/>
        </button_1.Button>
      </dropdown_menu_1.DropdownMenuTrigger>
      {user && (<dropdown_menu_1.DropdownMenuContent className="w-56" align="end" forceMount>
          <dropdown_menu_1.DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </dropdown_menu_1.DropdownMenuLabel>
          <dropdown_menu_1.DropdownMenuSeparator />
          <dropdown_menu_1.DropdownMenuGroup>
            <dropdown_menu_1.DropdownMenuItem className="px-2 py-1.5 text-sm font-normal" onClick={() => router.push("/settings")}> 
              <lucide_react_1.User className="mr-2 h-4 w-4"/>
              <span>Perfil</span>
            </dropdown_menu_1.DropdownMenuItem>
            <dropdown_menu_1.DropdownMenuItem className="px-2 py-1.5 text-sm font-normal" onClick={() => router.push("/settings?tab=app")}> 
              <lucide_react_1.Settings className="mr-2 h-4 w-4"/>
              <span>Configurações</span>
            </dropdown_menu_1.DropdownMenuItem>
            {user.role === "admin" && (<dropdown_menu_1.DropdownMenuItem className="px-2 py-1.5 text-sm font-normal" onClick={() => router.push("/admin")}>
                <lucide_react_1.Settings className="mr-2 h-4 w-4"/>
                <span>Administração</span>
              </dropdown_menu_1.DropdownMenuItem>)}
          </dropdown_menu_1.DropdownMenuGroup>
          <dropdown_menu_1.DropdownMenuSeparator />
        </dropdown_menu_1.DropdownMenuContent>)}
    </dropdown_menu_1.DropdownMenu>);
}
