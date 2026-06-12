import Swal from "sweetalert2";
import { router } from "@inertiajs/react";

type ConfirmOptions = {
  title?: string;
  text?: string;
  confirmText?: string;
};

export async function confirmDelete(options: ConfirmOptions = {}): Promise<boolean> {
  const result = await Swal.fire({
    title: options.title ?? "Are you sure?",
    text: options.text ?? "This item will be deleted. You can restore it later if needed.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#6b7280",
    confirmButtonText: options.confirmText ?? "Yes, delete it",
    cancelButtonText: "Cancel",
  });

  return result.isConfirmed;
}

type DeleteOptions = ConfirmOptions & {
  preserveScroll?: boolean;
  onSuccess?: () => void;
  onError?: () => void;
};

export async function routerDeleteWithConfirm(url: string, options: DeleteOptions = {}): Promise<void> {
  const confirmed = await confirmDelete(options);
  if (!confirmed) return;

  router.delete(url, {
    preserveScroll: options.preserveScroll ?? true,
    onSuccess: options.onSuccess,
    onError: options.onError,
  });
}
