/**
 * Warning in a modal before « Tout arrêter » and « Tout redémarrer » (Greg, 13/11): the dialog
 * of index.html, « Annuler » focused, Échap cancels.
 */

export interface Warning {
  title: string;
  text: string;
  confirm: string;
}

export function confirmAction({ title, text, confirm }: Warning): Promise<boolean> {
  const dialog = document.getElementById("confirm") as HTMLDialogElement;
  (document.getElementById("confirm-title") as HTMLElement).textContent = title;
  (document.getElementById("confirm-text") as HTMLElement).textContent = text;
  (document.getElementById("confirm-ok") as HTMLElement).textContent = confirm;
  dialog.returnValue = "";
  dialog.showModal();
  return new Promise((resolve) => {
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "ok"), { once: true });
  });
}
