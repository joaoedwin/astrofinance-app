"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionExpiredModal = SessionExpiredModal;
const dialog_1 = require("@/components/ui/dialog");
const button_1 = require("@/components/ui/button");
const navigation_1 = require("next/navigation");
const lucide_react_1 = require("lucide-react");
const alert_1 = require("@/components/ui/alert");
function SessionExpiredModal({ isOpen, onClose }) {
    const router = (0, navigation_1.useRouter)();
    return (<dialog_1.Dialog open={isOpen} onOpenChange={onClose}>
      <dialog_1.DialogContent className="sm:max-w-md">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle className="tracking-tight text-xl font-bold text-center flex items-center justify-center gap-2">
            <lucide_react_1.AlertCircle className="h-6 w-6 text-red-500"/>
            Sessão Expirada
          </dialog_1.DialogTitle>
          <dialog_1.DialogDescription className="text-sm text-muted-foreground text-center mt-2">
            Sua sessão expirou por motivos de segurança. Isso pode ter acontecido por:
          </dialog_1.DialogDescription>
        </dialog_1.DialogHeader>
        
        <alert_1.Alert variant="destructive" className="mt-4">
          <alert_1.AlertTitle>Razões possíveis:</alert_1.AlertTitle>
          <alert_1.AlertDescription>
            <ul className="list-disc pl-4 space-y-1">
              <li>Inatividade prolongada</li>
              <li>Token de acesso expirado</li>
              <li>Problemas de segurança detectados</li>
            </ul>
          </alert_1.AlertDescription>
        </alert_1.Alert>

        <div className="mt-4 text-sm text-muted-foreground">
          Por segurança, todos os dados sensíveis foram removidos da sessão atual.
          Faça login novamente para continuar usando o sistema.
        </div>

        <div className="flex justify-center mt-6">
          <button_1.Button variant="destructive" className="w-full max-w-[200px]" onClick={() => {
            onClose();
            router.push("/login");
        }}>
            Fazer Login
          </button_1.Button>
        </div>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
}
