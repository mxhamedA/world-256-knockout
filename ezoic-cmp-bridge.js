(() => {
  const privacyCenterStyle = document.createElement("style");
  privacyCenterStyle.textContent = "#ezPrivacyCenter { display: none !important; }";
  document.head.appendChild(privacyCenterStyle);

  const handlers = {
    "ez-accept-all": (cmp) => cmp.handleAcceptAllClick(),
    "ez-manage-settings": (cmp) => cmp.handleShowDetailsClick(),
    "ez-reject-all": (cmp) => cmp.handleRejectClick(),
    "ez-vendors": (cmp) => cmp.handleShowVendorsClick(),
    "ezCMPReturn": (cmp) => cmp._V2.showConsentBannerFirstPage(),
    "ez-save-settings": (cmp) => cmp.savePurposesAndExitModal(),
    "ez-show-vendors": (cmp) => cmp.savePurposesAndShowVendors(),
    "ez-show-vendors-btn": (cmp) => cmp.savePurposesAndShowVendors(),
    "open-ezoic-privacy-settings": (cmp) => cmp.generateCMPFromPrivacyCenter(),
  };

  document.addEventListener("click", (event) => {
    const control = event.target instanceof Element
      ? event.target.closest("[id]")
      : null;
    const handler = control ? handlers[control.id] : null;
    if (!handler || !window.ezCMP) return;

    event.preventDefault();
    event.stopPropagation();
    handler(window.ezCMP);
  }, true);
})();
