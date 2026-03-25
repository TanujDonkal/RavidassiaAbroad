import { Modal } from "bootstrap";

export function clearBootstrapModalArtifacts() {
  document.body.classList.remove("modal-open");
  document.body.style.removeProperty("padding-right");
  document.body.style.removeProperty("overflow");
  document
    .querySelectorAll(".modal-backdrop")
    .forEach((backdrop) => backdrop.remove());
}

export function createBootstrapModal(element) {
  return element ? new Modal(element) : null;
}

export function destroyBootstrapModal(instance) {
  instance?.hide();
  instance?.dispose();
  clearBootstrapModalArtifacts();
}
