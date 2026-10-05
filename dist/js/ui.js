/**
 * WOF RUSH - UI, Menus, 1,000m Vouchers & Admin Marketing Console
 * Handles HUD updates, 1000m voucher threshold, lead capture (name + phone),
 * interactive Admin Console with CSV export, WhatsApp links, and Leaderboard.
 */

class UIManager {
  constructor() {
    this.highScore = 0;
    this.dailyChallengeGoal = 1500;
    this.currentVoucher = null;
    this.lastStats = { score: 0, distance: 0, meals: 0, deliveries: 0, easterEggs: 0 };
    this.isAdminAuthenticated = false;
    this.adminLeadsCache = [];
    this.adminActiveTab = 'items';
    this.menuItemsCache = [];
    this.currentCategoryFilter = 'all';
    this.currentHealthFilter = 'all';
    this.currentRecipeItem = null;
    this.recipeIngredients = [];

    // Master Raw Materials & Two-Section Calculator state
    this.masterRawMaterials = [];
    this.activeMasterCategory = 'all';
    this.masterSearchTerm = '';
    this.masterSortOrder = 'name-asc';
    this.inflationSurgePct = 0;
    this.calcActiveView = 'split';

    this.loadData();
    this.cacheDOM();
    this.bindEvents();
    this.initLeaderboard();
    this.initAdminData();
    this.initMenuItems();
    this.initMasterRawMaterials();
    this.updateHomeScreen();

    // Check URL hash for direct admin link (#admin)
    if (window.location.hash === '#admin') {
      setTimeout(() => this.openAdminConsole(), 300);
    }
  }

  loadData() {
    try {
      const saved = localStorage.getItem('wof_rush_highscore');
      this.highScore = saved !== null ? parseInt(saved, 10) : 0;
      if (isNaN(this.highScore)) this.highScore = 0;
    } catch (e) {
      this.highScore = 0;
    }
  }

  saveHighScore(score) {
    if (score > this.highScore) {
      this.highScore = score;
      try {
        localStorage.setItem('wof_rush_highscore', this.highScore.toString());
      } catch (e) {}
    }
  }

  resetHighScore() {
    try {
      localStorage.removeItem('wof_rush_highscore');
    } catch (e) {}
    this.highScore = 0;
    this.updateHomeScreen();
    this.showFloatingToast('High score reset!', '#FFD000', 1500);
  }

  cacheDOM() {
    // Screens
    this.homeScreen = document.getElementById('home-screen');
    this.gameScreen = document.getElementById('game-screen');
    this.pauseModal = document.getElementById('pause-modal');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.leaderboardModal = document.getElementById('leaderboard-modal');
    this.howToPlayModal = document.getElementById('how-to-play-modal');
    this.adminModal = document.getElementById('admin-modal');

    // HUD Elements
    this.hudScore = document.getElementById('hud-score');
    this.hudDistance = document.getElementById('hud-distance');
    this.hudCoins = document.getElementById('hud-coins');
    this.hudMultiplier = document.getElementById('hud-multiplier');
    this.slotMain = document.getElementById('slot-main');
    this.slotSide = document.getElementById('slot-side');
    this.slotDrink = document.getElementById('slot-drink');
    this.powerupsContainer = document.getElementById('powerups-container');
    this.toastContainer = document.getElementById('toast-container');

    // Delivery Card
    this.deliveryCard = document.getElementById('delivery-card');
    this.deliveryOrderTitle = document.getElementById('delivery-order-title');
    this.deliveryItemsList = document.getElementById('delivery-items-list');
    this.deliveryTimerText = document.getElementById('delivery-timer-text');
    this.deliveryTimerBar = document.getElementById('delivery-timer-bar');

    // Home Screen Elements
    this.homeBestScore = document.getElementById('home-best-score');
    this.resetScoreBtn = document.getElementById('reset-score-btn');
    this.dailyChallengeStatus = document.getElementById('daily-challenge-status');

    // Game Over Elements
    this.finalScore = document.getElementById('final-score');
    this.finalDistance = document.getElementById('final-distance');
    this.finalCoins = document.getElementById('final-coins');
    this.finalMeals = document.getElementById('final-meals');
    this.finalDeliveries = document.getElementById('final-deliveries');
    this.finalEasterEggs = document.getElementById('final-easter-eggs');
    this.newHighScoreBanner = document.getElementById('new-high-score-banner');
    this.goLeaderboardBtn = document.getElementById('go-leaderboard-btn');

    // Voucher Card (Conditioned on 1,000m+)
    this.voucherCard = document.getElementById('voucher-card');
    this.voucherHeader = document.getElementById('voucher-header');
    this.voucherTitle = document.getElementById('voucher-title');
    this.voucherDiscount = document.getElementById('voucher-discount');
    this.voucherProgressBox = document.getElementById('voucher-progress-box');
    this.voucherDistText = document.getElementById('voucher-dist-text');
    this.voucherProgressFill = document.getElementById('voucher-progress-fill');
    this.voucherDistRem = document.getElementById('voucher-dist-rem');
    this.voucherCodeRow = document.getElementById('voucher-code-row');
    this.voucherCode = document.getElementById('voucher-code');
    this.voucherNote = document.getElementById('voucher-note');
    this.copyVoucherBtn = document.getElementById('copy-voucher-btn');

    // Lead Registration Form (Name + Phone)
    this.playerNameInput = document.getElementById('player-name-input');
    this.playerPhoneInput = document.getElementById('player-phone-input');
    this.submitScoreBtn = document.getElementById('submit-score-btn');
    this.submitFeedbackMsg = document.getElementById('submit-feedback-msg');

    // Sound Toggles
    this.soundToggleBtn = document.getElementById('sound-toggle-btn');
    this.hudSoundBtn = document.getElementById('hud-sound-btn');
    this.adminBtn = document.getElementById('admin-btn');

    // Admin Console Elements
    this.adminAuthGate = document.getElementById('admin-auth-gate');
    this.adminDashboardView = document.getElementById('admin-dashboard-view');
    this.adminPassInput = document.getElementById('admin-pass-input');
    this.adminLoginBtn = document.getElementById('admin-login-btn');
    this.adminAuthErr = document.getElementById('admin-auth-err');
    this.adminLeadsTbody = document.getElementById('admin-leads-tbody');
    this.adminSearchInput = document.getElementById('admin-search-input');
    this.adminExportCsvBtn = document.getElementById('admin-export-csv-btn');
    this.adminCopyPhonesBtn = document.getElementById('admin-copy-phones-btn');
    this.adminRefreshBtn = document.getElementById('admin-refresh-btn');
    this.closeAdminBtn = document.getElementById('close-admin-btn');

    // Admin KPI Cards
    this.kpiTotalPlayers = document.getElementById('kpi-total-players');
    this.kpiTotalDistance = document.getElementById('kpi-total-distance');
    this.kpiCouponsIssued = document.getElementById('kpi-coupons-issued');
    this.kpiCouponsRedeemed = document.getElementById('kpi-coupons-redeemed');

    // Admin Tabs & Navigation
    this.adminTabBtns = document.querySelectorAll('.admin-tab-btn');
    this.adminTabContents = document.querySelectorAll('.admin-tab-content');

    // Menu Items & Cost Tracker Elements
    this.kpiTotalItems = document.getElementById('kpi-total-items');
    this.kpiAvgFoodCost = document.getElementById('kpi-avg-food-cost');
    this.kpiAvgPrice = document.getElementById('kpi-avg-price');
    this.kpiAvgMargin = document.getElementById('kpi-avg-margin');
    this.catPills = document.querySelectorAll('.cat-pill');
    this.adminItemsTbody = document.getElementById('admin-items-tbody');
    this.adminItemsSearchInput = document.getElementById('admin-items-search-input');
    this.adminItemsHealthFilter = document.getElementById('admin-items-health-filter');
    this.adminItemsSortSelect = document.getElementById('admin-items-sort-select');
    this.adminAddItemBtn = document.getElementById('admin-add-item-btn');
    this.adminExportItemsCsvBtn = document.getElementById('admin-export-items-csv-btn');

    // Recipe Cost Calculator Elements
    this.calcPresetSelect = document.getElementById('calc-preset-select');
    this.calcLoadPresetBtn = document.getElementById('calc-load-preset-btn');
    this.calcItemName = document.getElementById('calc-item-name');
    this.calcItemCategory = document.getElementById('calc-item-category');
    this.calcItemPortion = document.getElementById('calc-item-portion');
    this.calcActiveItemTag = document.getElementById('calc-active-item-tag');
    this.calcIngredientsTbody = document.getElementById('calc-ingredients-tbody');
    this.calcAddIngBtn = document.getElementById('calc-add-ing-btn');
    this.calcPackagingCost = document.getElementById('calc-packaging-cost');
    this.calcWastagePct = document.getElementById('calc-wastage-pct');
    this.calcTotalCostHero = document.getElementById('calc-total-cost-hero');
    this.calcRawIngCost = document.getElementById('calc-raw-ing-cost');
    this.calcPackagingCostDisplay = document.getElementById('calc-packaging-cost-display');
    this.calcWastageCostDisplay = document.getElementById('calc-wastage-cost-display');
    this.calcSellingPriceInput = document.getElementById('calc-selling-price-input');
    this.calcFoodCostPctDisplay = document.getElementById('calc-food-cost-pct-display');
    this.calcGaugeFill = document.getElementById('calc-gauge-fill');
    this.calcGrossProfitDisplay = document.getElementById('calc-gross-profit-display');
    this.calcGrossMarginDisplay = document.getElementById('calc-gross-margin-display');
    this.calcMarkupDisplay = document.getElementById('calc-markup-display');
    this.calcTargetFcInput = document.getElementById('calc-target-fc-input');
    this.calcTargetFcLbl = document.getElementById('calc-target-fc-lbl');
    this.calcCharmPricingCb = document.getElementById('calc-charm-pricing-cb');
    this.calcSuggestedPriceDisplay = document.getElementById('calc-suggested-price-display');
    this.calcSaveItemBtn = document.getElementById('calc-save-item-btn');
    this.calcResetBtn = document.getElementById('calc-reset-btn');
    this.calcCopySummaryBtn = document.getElementById('calc-copy-summary-btn');

    // Food Cost Analyzer Elements
    this.simPriceSlider = document.getElementById('sim-price-slider');
    this.simPriceVal = document.getElementById('sim-price-val');
    this.simCostSlider = document.getElementById('sim-cost-slider');
    this.simCostVal = document.getElementById('sim-cost-val');
    this.simHealthBadge = document.getElementById('sim-health-badge');
    this.simSegFood = document.getElementById('sim-seg-food');
    this.simSegLabor = document.getElementById('sim-seg-labor');
    this.simSegOverhead = document.getElementById('sim-seg-overhead');
    this.simSegProfit = document.getElementById('sim-seg-profit');
    this.simFoodLbl = document.getElementById('sim-food-lbl');
    this.simNetProfitLbl = document.getElementById('sim-net-profit-lbl');
    this.simAdviceBox = document.getElementById('sim-advice-box');
    this.simInflationDetails = document.getElementById('sim-inflation-details');
    this.periodInvBegin = document.getElementById('period-inv-begin');
    this.periodPurchases = document.getElementById('period-purchases');
    this.periodInvEnd = document.getElementById('period-inv-end');
    this.periodSales = document.getElementById('period-sales');
    this.periodCogsVal = document.getElementById('period-cogs-val');
    this.periodFcVal = document.getElementById('period-fc-val');
    this.periodStatusVal = document.getElementById('period-status-val');
    this.matrixStarsList = document.getElementById('matrix-stars-list');
    this.matrixPlowhorsesList = document.getElementById('matrix-plowhorses-list');
    this.matrixPuzzlesList = document.getElementById('matrix-puzzles-list');
    this.matrixDogsList = document.getElementById('matrix-dogs-list');

    // Add / Edit Item Submodal Elements
    this.adminItemSubmodal = document.getElementById('admin-item-submodal');
    this.adminItemForm = document.getElementById('admin-item-form');
    this.closeItemSubmodalBtn = document.getElementById('close-item-submodal-btn');
    this.cancelItemSubmodalBtn = document.getElementById('cancel-item-submodal-btn');
    this.editItemId = document.getElementById('edit-item-id');
    this.editItemName = document.getElementById('edit-item-name');
    this.editItemCategory = document.getElementById('edit-item-category');
    this.editItemIcon = document.getElementById('edit-item-icon');
    this.editItemPrice = document.getElementById('edit-item-price');
    this.editItemCost = document.getElementById('edit-item-cost');
    this.editItemPortion = document.getElementById('edit-item-portion');
    this.editItemPopularity = document.getElementById('edit-item-popularity');
    this.editItemTargetFc = document.getElementById('edit-item-target-fc');
    this.editItemFcPreview = document.getElementById('edit-item-fc-preview');
    this.editItemMarginPreview = document.getElementById('edit-item-margin-preview');

    // Stripe-Style Dashboard Layout Elements
    this.stripeSidebar = document.getElementById('stripe-sidebar');
    this.stripeMobileToggle = document.getElementById('stripe-mobile-toggle');
    this.stripeExitBtn = document.getElementById('stripe-exit-btn');
    this.stripeActiveCrumb = document.getElementById('stripe-active-crumb');
    this.topbarQuickActionBtn = document.getElementById('topbar-quick-action-btn');
    this.stripeNavItems = document.querySelectorAll('.stripe-nav-item');
    this.navCountItems = document.getElementById('nav-count-items');
    this.navCountOffers = document.getElementById('nav-count-offers');
    this.navCountLeads = document.getElementById('nav-count-leads');

    // Milestone Offers Manager (CRUD) Elements
    this.adminAddOfferBtn = document.getElementById('admin-add-offer-btn');
    this.adminResetOffersBtn = document.getElementById('admin-reset-offers-btn');
    this.adminOffersSearchInput = document.getElementById('admin-offers-search-input');
    this.adminOffersTbody = document.getElementById('admin-offers-tbody');
    this.offerFilterBtns = document.querySelectorAll('.offer-filter-btn');
    this.kpiTotalOffers = document.getElementById('kpi-total-offers');
    this.kpiDistOffers = document.getElementById('kpi-dist-offers');
    this.kpiScoreOffers = document.getElementById('kpi-score-offers');
    this.kpiMissionOffers = document.getElementById('kpi-mission-offers');
    this.offersCountAll = document.getElementById('offers-count-all');
    this.offersCountDist = document.getElementById('offers-count-dist');
    this.offersCountScore = document.getElementById('offers-count-score');
    this.offersCountMissions = document.getElementById('offers-count-missions');

    // Offer Add/Edit Submodal Elements
    this.adminOfferSubmodal = document.getElementById('admin-offer-submodal');
    this.adminOfferForm = document.getElementById('admin-offer-form');
    this.offerModalTitle = document.getElementById('offer-modal-title');
    this.closeOfferSubmodalBtn = document.getElementById('close-offer-submodal-btn');
    this.cancelOfferSubmodalBtn = document.getElementById('cancel-offer-submodal-btn');
    this.saveOfferSubmodalBtn = document.getElementById('save-offer-submodal-btn');
    this.editOfferId = document.getElementById('edit-offer-id');
    this.editOfferTitle = document.getElementById('edit-offer-title');
    this.editOfferType = document.getElementById('edit-offer-type');
    this.editOfferThreshold = document.getElementById('edit-offer-threshold');
    this.editOfferThresholdLbl = document.getElementById('edit-offer-threshold-lbl');
    this.editOfferReward = document.getElementById('edit-offer-reward');
    this.editOfferPrefix = document.getElementById('edit-offer-prefix');
    this.editOfferMinOrder = document.getElementById('edit-offer-min-order');
    this.editOfferDesc = document.getElementById('edit-offer-desc');
    this.editOfferActive = document.getElementById('edit-offer-active');

    // WOF Standard Recipe Puller & Raw Materials Formulation Elements
    this.calcRecipeSelect = document.getElementById('calc-recipe-select');
    this.calcPullRecipeBtn = document.getElementById('calc-pull-recipe-btn');
    this.calcOpenPasteModalBtn = document.getElementById('calc-open-paste-modal-btn');
    this.calcRawMaterialsTbody = document.getElementById('calc-raw-materials-tbody');
    this.calcAddRawMatBtn = document.getElementById('calc-add-raw-mat-btn');
    this.calcTotalFoodCostHero = document.getElementById('calc-total-food-cost-hero');
    this.calcRawMaterialsCost = document.getElementById('calc-raw-materials-cost');
    this.calcSaveItemBtnBottom = document.getElementById('calc-save-item-btn-bottom');

    // Section 1 & Section 2 Calculator Elements
    this.calcSwitchBtns = document.querySelectorAll('.calc-switch-btn');
    this.calcSection1 = document.getElementById('calc-section-1');
    this.calcSection2 = document.getElementById('calc-section-2');
    this.calcSyncAllItemsBtn = document.getElementById('calc-sync-all-items-btn');
    this.calcExportMasterCsvBtn = document.getElementById('calc-export-master-csv-btn');
    this.masterAddMatBtn = document.getElementById('master-add-mat-btn');
    this.masterSearchInput = document.getElementById('master-search-input');
    this.masterSortSelect = document.getElementById('master-sort-select');
    this.masterCategoryPills = document.querySelectorAll('#master-category-pills .cat-pill');
    this.masterRawMaterialsTbody = document.getElementById('master-raw-materials-tbody');
    this.masterTotalMaterials = document.getElementById('master-total-materials');
    this.masterMatCountBadge = document.getElementById('master-mat-count-badge');
    this.masterInflationSlider = document.getElementById('master-inflation-slider');
    this.masterInflationVal = document.getElementById('master-inflation-val');
    this.masterInflationImpact = document.getElementById('master-inflation-impact');
    this.quickAddMatSelect = document.getElementById('quick-add-mat-select');
    this.quickAddQty = document.getElementById('quick-add-qty');
    this.quickAddUom = document.getElementById('quick-add-uom');
    this.quickAddSubmitBtn = document.getElementById('quick-add-submit-btn');
    this.recipeQuickChips = document.getElementById('recipe-quick-chips');
    this.calcApplySuggestedBtn = document.getElementById('calc-apply-suggested-btn');

    // Master Raw Material Submodal Elements
    this.adminMaterialSubmodal = document.getElementById('admin-material-submodal');
    this.adminMatForm = document.getElementById('admin-mat-form');
    this.matModalTitle = document.getElementById('mat-modal-title');
    this.closeMatSubmodalBtn = document.getElementById('close-mat-submodal-btn');
    this.cancelMatSubmodalBtn = document.getElementById('cancel-mat-submodal-btn');
    this.matModalId = document.getElementById('mat-modal-id');
    this.matModalName = document.getElementById('mat-modal-name');
    this.matModalCategory = document.getElementById('mat-modal-category');
    this.matModalUnit = document.getElementById('mat-modal-unit');
    this.matModalRate = document.getElementById('mat-modal-rate');
    this.matModalBasePreview = document.getElementById('mat-modal-base-preview');
    this.matModalNotes = document.getElementById('mat-modal-notes');

    // Recipe Paste Modal Elements
    this.adminRecipePasteModal = document.getElementById('admin-recipe-paste-modal');
    this.recipePasteTextarea = document.getElementById('recipe-paste-textarea');
    this.applyRecipePasteBtn = document.getElementById('apply-recipe-paste-btn');
    this.cancelRecipePasteBtn = document.getElementById('cancel-recipe-paste-btn');
    this.closeRecipePasteBtn = document.getElementById('close-recipe-paste-btn');
  }

  bindEvents() {
    // Start / Restart / Home
    document.getElementById('play-btn').addEventListener('click', () => this.startGame());
    document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
    document.getElementById('home-btn').addEventListener('click', () => this.showHomeScreen());

    // Pause / Resume
    document.getElementById('hud-pause-btn').addEventListener('click', () => {
      if (window.wofGame) window.wofGame.togglePause();
    });

    document.getElementById('resume-btn').addEventListener('click', () => {
      if (window.wofGame) window.wofGame.togglePause();
    });

    document.getElementById('quit-to-menu-btn').addEventListener('click', () => {
      if (window.wofGame) {
        window.wofGame.isPlaying = false;
        window.audioManager.stopMusic();
      }
      this.showPauseMenu(false);
      this.showHomeScreen();
    });

    // Modals
    document.getElementById('leaderboard-btn').addEventListener('click', () => this.openLeaderboard());
    document.getElementById('close-leaderboard-btn').addEventListener('click', () => this.leaderboardModal.classList.add('hidden'));

    if (this.goLeaderboardBtn) {
      this.goLeaderboardBtn.addEventListener('click', () => this.openLeaderboard());
    }

    if (this.resetScoreBtn) {
      this.resetScoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.resetHighScore();
      });
    }

    document.getElementById('how-to-play-btn').addEventListener('click', () => this.howToPlayModal.classList.remove('hidden'));
    document.getElementById('close-how-to-play-btn').addEventListener('click', () => this.howToPlayModal.classList.add('hidden'));

    // Admin Console triggers
    if (this.adminBtn) {
      this.adminBtn.addEventListener('click', () => this.openAdminConsole());
    }
    if (this.closeAdminBtn) {
      this.closeAdminBtn.addEventListener('click', () => this.adminModal.classList.add('hidden'));
    }
    if (this.adminLoginBtn) {
      this.adminLoginBtn.addEventListener('click', () => this.handleAdminLogin());
    }
    if (this.adminPassInput) {
      this.adminPassInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleAdminLogin();
      });
    }

    // Keyboard shortcut for Admin: Shift + A
    window.addEventListener('keydown', (e) => {
      if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        this.openAdminConsole();
      }
    });

    // Admin Dashboard Actions
    if (this.adminSearchInput) {
      this.adminSearchInput.addEventListener('input', () => this.filterAdminTable());
    }
    if (this.adminExportCsvBtn) {
      this.adminExportCsvBtn.addEventListener('click', () => this.exportLeadsToCSV());
    }
    if (this.adminCopyPhonesBtn) {
      this.adminCopyPhonesBtn.addEventListener('click', () => this.copyPhoneNumbersList());
    }
    if (this.adminRefreshBtn) {
      this.adminRefreshBtn.addEventListener('click', () => this.refreshAdminData());
    }

    // Admin Tab Navigation
    // Admin Tab Navigation (Classic buttons and Stripe Sidebar items)
    if (this.adminTabBtns) {
      this.adminTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const targetTab = btn.getAttribute('data-tab');
          this.switchAdminTab(targetTab);
        });
      });
    }

    if (this.stripeNavItems) {
      this.stripeNavItems.forEach(item => {
        item.addEventListener('click', () => {
          const targetTab = item.getAttribute('data-tab');
          this.switchAdminTab(targetTab);
          if (this.stripeSidebar) this.stripeSidebar.classList.remove('mobile-open');
        });
      });
    }

    if (this.stripeMobileToggle && this.stripeSidebar) {
      this.stripeMobileToggle.addEventListener('click', () => {
        this.stripeSidebar.classList.toggle('mobile-open');
      });
    }

    if (this.stripeExitBtn) {
      this.stripeExitBtn.addEventListener('click', () => {
        this.adminModal.classList.add('hidden');
      });
    }

    if (this.topbarQuickActionBtn) {
      this.topbarQuickActionBtn.addEventListener('click', () => {
        if (this.adminActiveTab === 'items') {
          this.openAddItemModal();
        } else if (this.adminActiveTab === 'calculator') {
          this.saveRecipeAsMenuItem();
        } else if (this.adminActiveTab === 'offers') {
          this.openOfferModal();
        } else if (this.adminActiveTab === 'leads') {
          this.exportLeadsToCSV();
        } else if (this.adminActiveTab === 'food-cost') {
          if (this.simPriceSlider) this.simPriceSlider.focus();
        }
      });
    }

    // Milestone Offers CRUD Events
    if (this.adminAddOfferBtn) {
      this.adminAddOfferBtn.addEventListener('click', () => this.openOfferModal());
    }
    if (this.adminResetOffersBtn) {
      this.adminResetOffersBtn.addEventListener('click', () => this.resetOffersToDefault());
    }
    if (this.adminOffersSearchInput) {
      this.adminOffersSearchInput.addEventListener('input', () => this.filterOffersTable());
    }
    if (this.offerFilterBtns) {
      this.offerFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.offerFilterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeOffersFilter = btn.getAttribute('data-filter') || 'all';
          this.filterOffersTable();
        });
      });
    }
    if (this.closeOfferSubmodalBtn) {
      this.closeOfferSubmodalBtn.addEventListener('click', () => this.closeOfferModal());
    }
    if (this.cancelOfferSubmodalBtn) {
      this.cancelOfferSubmodalBtn.addEventListener('click', () => this.closeOfferModal());
    }
    if (this.adminOfferForm) {
      this.adminOfferForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveOffer();
      });
    }
    if (this.editOfferType) {
      this.editOfferType.addEventListener('change', () => this.updateOfferThresholdLabel());
    }

    // Recipe Standard Puller & Raw Materials Events
    if (this.calcPullRecipeBtn && this.calcRecipeSelect) {
      this.calcPullRecipeBtn.addEventListener('click', () => {
        this.pullRecipeIntoCalculator(this.calcRecipeSelect.value);
      });
      this.calcRecipeSelect.addEventListener('change', () => {
        this.pullRecipeIntoCalculator(this.calcRecipeSelect.value);
      });
    }
    if (this.calcAddRawMatBtn) {
      this.calcAddRawMatBtn.addEventListener('click', () => {
        this.addRawMaterialRow();
      });
    }
    if (this.calcSaveItemBtnBottom) {
      this.calcSaveItemBtnBottom.addEventListener('click', () => this.saveRecipeAsMenuItem());
    }
    if (this.calcOpenPasteModalBtn) {
      this.calcOpenPasteModalBtn.addEventListener('click', () => this.openRecipePasteModal());
    }
    if (this.applyRecipePasteBtn) {
      this.applyRecipePasteBtn.addEventListener('click', () => this.handleApplyRecipePaste());
    }
    if (this.closeRecipePasteBtn) {
      this.closeRecipePasteBtn.addEventListener('click', () => this.closeRecipePasteModal());
    }
    if (this.cancelRecipePasteBtn) {
      this.cancelRecipePasteBtn.addEventListener('click', () => this.closeRecipePasteModal());
    }

    // Section 1: Master Raw Materials & Two-Section Calculator Events
    if (this.calcSwitchBtns) {
      this.calcSwitchBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.calcSwitchBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const view = btn.getAttribute('data-view') || 'split';
          this.switchCalcSubView(view);
        });
      });
    }

    if (this.calcSyncAllItemsBtn) {
      this.calcSyncAllItemsBtn.addEventListener('click', () => this.recalculateAllMenuItemsFromMaster());
    }

    if (this.calcExportMasterCsvBtn) {
      this.calcExportMasterCsvBtn.addEventListener('click', () => this.exportMasterMaterialsCSV());
    }

    if (this.masterAddMatBtn) {
      this.masterAddMatBtn.addEventListener('click', () => this.openAddMaterialModal());
    }

    if (this.masterSearchInput) {
      this.masterSearchInput.addEventListener('input', (e) => {
        this.masterSearchTerm = (e.target.value || '').toLowerCase().trim();
        this.renderMasterRawMaterialsTable();
      });
    }

    if (this.masterSortSelect) {
      this.masterSortSelect.addEventListener('change', (e) => {
        this.masterSortOrder = e.target.value || 'name-asc';
        this.renderMasterRawMaterialsTable();
      });
    }

    if (this.masterCategoryPills) {
      this.masterCategoryPills.forEach(pill => {
        pill.addEventListener('click', () => {
          this.masterCategoryPills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.activeMasterCategory = pill.getAttribute('data-cat') || 'all';
          this.renderMasterRawMaterialsTable();
        });
      });
    }

    if (this.masterInflationSlider) {
      this.masterInflationSlider.addEventListener('input', (e) => {
        const pct = parseInt(e.target.value, 10) || 0;
        this.handleInflationSlider(pct);
      });
    }

    if (this.quickAddSubmitBtn) {
      this.quickAddSubmitBtn.addEventListener('click', () => this.handleQuickAddIngredient());
    }

    if (this.calcApplySuggestedBtn) {
      this.calcApplySuggestedBtn.addEventListener('click', () => this.applySuggestedPrice());
    }

    // Master Material Submodal Events
    if (this.closeMatSubmodalBtn) {
      this.closeMatSubmodalBtn.addEventListener('click', () => this.closeAddMaterialModal());
    }
    if (this.cancelMatSubmodalBtn) {
      this.cancelMatSubmodalBtn.addEventListener('click', () => this.closeAddMaterialModal());
    }
    if (this.adminMatForm) {
      this.adminMatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveMaterial();
      });
    }
    if (this.matModalRate || this.matModalUnit) {
      const updatePreview = () => this.updateMatModalBasePreview();
      if (this.matModalRate) this.matModalRate.addEventListener('input', updatePreview);
      if (this.matModalUnit) this.matModalUnit.addEventListener('change', updatePreview);
    }

    // Menu Item Filters & Controls
    if (this.catPills) {
      this.catPills.forEach(pill => {
        pill.addEventListener('click', () => {
          this.catPills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.currentCategoryFilter = pill.getAttribute('data-cat');
          this.filterItemsTable();
        });
      });
    }
    if (this.adminItemsSearchInput) {
      this.adminItemsSearchInput.addEventListener('input', () => this.filterItemsTable());
    }
    if (this.adminItemsHealthFilter) {
      this.adminItemsHealthFilter.addEventListener('change', () => this.filterItemsTable());
    }
    if (this.adminItemsSortSelect) {
      this.adminItemsSortSelect.addEventListener('change', () => this.filterItemsTable());
    }
    if (this.adminAddItemBtn) {
      this.adminAddItemBtn.addEventListener('click', () => this.openAddItemModal());
    }
    if (this.adminExportItemsCsvBtn) {
      this.adminExportItemsCsvBtn.addEventListener('click', () => this.exportItemsToCSV());
    }

    // Recipe Cost Calculator Events
    if (this.calcLoadPresetBtn && this.calcPresetSelect) {
      this.calcLoadPresetBtn.addEventListener('click', () => {
        this.loadRecipePreset(this.calcPresetSelect.value);
      });
      this.calcPresetSelect.addEventListener('change', () => {
        this.loadRecipePreset(this.calcPresetSelect.value);
      });
    }
    if (this.calcAddIngBtn) {
      this.calcAddIngBtn.addEventListener('click', () => {
        this.addIngredientRow();
      });
    }
    ['calcItemName', 'calcItemCategory', 'calcItemPortion'].forEach(field => {
      if (this[field]) {
        this[field].addEventListener('input', () => this.updateRecipeMetadata());
      }
    });
    ['calcPackagingCost', 'calcWastagePct', 'calcSellingPriceInput', 'calcTargetFcInput'].forEach(field => {
      if (this[field]) {
        this[field].addEventListener('input', () => this.recalculateRecipeCost());
      }
    });
    if (this.calcCharmPricingCb) {
      this.calcCharmPricingCb.addEventListener('change', () => this.recalculateRecipeCost());
    }
    if (this.calcSaveItemBtn) {
      this.calcSaveItemBtn.addEventListener('click', () => this.saveRecipeAsMenuItem());
    }
    if (this.calcResetBtn) {
      this.calcResetBtn.addEventListener('click', () => this.loadRecipePreset('blank'));
    }
    if (this.calcCopySummaryBtn) {
      this.calcCopySummaryBtn.addEventListener('click', () => this.copyRecipeBreakdown());
    }

    // Food Cost & Margin Analyzer Events
    if (this.simPriceSlider) {
      this.simPriceSlider.addEventListener('input', () => this.updateFoodCostSimulation());
    }
    if (this.simCostSlider) {
      this.simCostSlider.addEventListener('input', () => this.updateFoodCostSimulation());
    }
    ['periodInvBegin', 'periodPurchases', 'periodInvEnd', 'periodSales'].forEach(field => {
      if (this[field]) {
        this[field].addEventListener('input', () => this.calculatePeriodFoodCost());
      }
    });

    // Add / Edit Item Submodal Events
    if (this.closeItemSubmodalBtn) {
      this.closeItemSubmodalBtn.addEventListener('click', () => this.closeAddItemModal());
    }
    if (this.cancelItemSubmodalBtn) {
      this.cancelItemSubmodalBtn.addEventListener('click', () => this.closeAddItemModal());
    }
    if (this.adminItemForm) {
      this.adminItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveItemSubmodal();
      });
      ['editItemPrice', 'editItemCost'].forEach(f => {
        if (this[f]) {
          this[f].addEventListener('input', () => this.updateItemModalPreview());
        }
      });
    }

    // Sound Toggles
    const toggleSound = () => {
      const isMuted = window.audioManager.toggleMute();
      const icon = isMuted ? '🔇' : '🔊';
      if (this.soundToggleBtn) this.soundToggleBtn.textContent = icon;
      if (this.hudSoundBtn) this.hudSoundBtn.textContent = icon;
    };

    if (this.soundToggleBtn) this.soundToggleBtn.addEventListener('click', toggleSound);
    if (this.hudSoundBtn) this.hudSoundBtn.addEventListener('click', toggleSound);

    // Copy Voucher Code
    if (this.copyVoucherBtn) {
      this.copyVoucherBtn.addEventListener('click', () => {
        const code = this.voucherCode.textContent;
        navigator.clipboard.writeText(code).then(() => {
          this.copyVoucherBtn.textContent = 'COPIED! ✓';
          setTimeout(() => { this.copyVoucherBtn.textContent = 'COPY CODE'; }, 2000);
        }).catch(() => {
          this.copyVoucherBtn.textContent = 'COPIED!';
        });
      });
    }

    // Lead Registration Form Submission (Name + Phone)
    if (this.submitScoreBtn) {
      this.submitScoreBtn.addEventListener('click', () => this.handleSubmitLead());
    }

    // On-screen Mobile Touch Controls (Buttons at bottom)
    const btnLeft = document.getElementById('touch-left');
    const btnRight = document.getElementById('touch-right');
    const btnJump = document.getElementById('touch-jump');
    const btnSlide = document.getElementById('touch-slide');

    const attachTouch = (btn, action) => {
      if (!btn) return;
      const doAction = (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.add('active');
        if (window.wofGame) action();
        setTimeout(() => btn.classList.remove('active'), 150);
      };
      btn.addEventListener('touchstart', doAction, { passive: false });
      btn.addEventListener('mousedown', doAction);
    };

    attachTouch(btnLeft, () => window.wofGame.moveLane(-1));
    attachTouch(btnRight, () => window.wofGame.moveLane(1));
    attachTouch(btnJump, () => window.wofGame.jump());
    attachTouch(btnSlide, () => window.wofGame.slide());
  }

  updateHomeScreen() {
    if (this.homeBestScore) {
      if (this.highScore > 0) {
        this.homeBestScore.textContent = `${this.highScore.toLocaleString()} PTS`;
        if (this.resetScoreBtn) this.resetScoreBtn.classList.remove('hidden');
      } else {
        this.homeBestScore.textContent = 'NO RUNS YET';
        if (this.resetScoreBtn) this.resetScoreBtn.classList.add('hidden');
      }
    }
    if (this.soundToggleBtn) {
      this.soundToggleBtn.textContent = window.audioManager.isMuted ? '🔇' : '🔊';
    }
  }

  startGame() {
    this.homeScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.gameScreen.classList.remove('hidden');

    if (!window.wofGame) {
      window.wofGame = new WOFGame();
    }
    window.wofGame.start();
  }

  restartGame() {
    this.gameOverScreen.classList.add('hidden');
    this.gameScreen.classList.remove('hidden');
    if (window.wofGame) {
      window.wofGame.start();
    }
  }

  showHomeScreen() {
    this.gameScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.homeScreen.classList.remove('hidden');
    this.updateHomeScreen();
  }

  showPauseMenu(show) {
    if (show) {
      this.pauseModal.classList.remove('hidden');
    } else {
      this.pauseModal.classList.add('hidden');
    }
  }

  // --- HUD UPDATES ---
  updateHUD() {
    if (!window.wofGame) return;
    const g = window.wofGame;

    this.hudScore.textContent = Math.floor(g.score).toLocaleString();
    this.hudDistance.textContent = `${Math.floor(g.distance)}m`;
    if (this.hudCoins) {
      this.hudCoins.textContent = (g.coins || 0).toLocaleString();
    }

    if (g.scoreMultiplier > 1) {
      this.hudMultiplier.textContent = `x${g.scoreMultiplier} COMBO!`;
      this.hudMultiplier.classList.remove('hidden');
      if (g.scoreMultiplier >= 6) {
        this.hudMultiplier.classList.add('max-combo');
      } else {
        this.hudMultiplier.classList.remove('max-combo');
      }
    } else {
      this.hudMultiplier.classList.add('hidden');
    }

    this.updatePowerupBadges(g.activePowerups);
  }

  updateMealSlots(meal) {
    // Main Slot
    if (meal.main) {
      const icon = meal.main === 'pizza' ? '🍕' : (meal.main === 'wrap' ? '🌯' : '🍔');
      this.slotMain.innerHTML = `<span class="slot-icon">${icon}</span> <span class="slot-name">${meal.main.toUpperCase()}</span>`;
      this.slotMain.classList.add('filled');
    } else {
      this.slotMain.innerHTML = `<span class="slot-icon">🍔</span> <span class="slot-name">MAIN</span>`;
      this.slotMain.classList.remove('filled');
    }

    // Side Slot
    if (meal.side) {
      const icon = meal.side === 'waffle' ? '🧇' : '🍟';
      this.slotSide.innerHTML = `<span class="slot-icon">${icon}</span> <span class="slot-name">${meal.side.toUpperCase()}</span>`;
      this.slotSide.classList.add('filled');
    } else {
      this.slotSide.innerHTML = `<span class="slot-icon">🍟</span> <span class="slot-name">SIDE</span>`;
      this.slotSide.classList.remove('filled');
    }

    // Drink Slot
    if (meal.drink) {
      const icon = meal.drink === 'falooda' ? '🧋' : '🥤';
      this.slotDrink.innerHTML = `<span class="slot-icon">${icon}</span> <span class="slot-name">${meal.drink.toUpperCase()}</span>`;
      this.slotDrink.classList.add('filled');
    } else {
      this.slotDrink.innerHTML = `<span class="slot-icon">🥤</span> <span class="slot-name">DRINK</span>`;
      this.slotDrink.classList.remove('filled');
    }
  }

  showMealCompleteBanner(bonus) {
    this.showFloatingToast(`🔥 WOF MEAL COMPLETE! +${bonus} PTS! 🔥`, '#FFD000', 2500);

    [this.slotMain, this.slotSide, this.slotDrink].forEach(slot => {
      slot.classList.add('celebrate');
      setTimeout(() => slot.classList.remove('celebrate'), 1000);
    });
  }

  // --- DELIVERY CARD UPDATES ---
  showDeliveryCard(order, duration) {
    this.deliveryCard.classList.remove('hidden');
    this.deliveryOrderTitle.textContent = `DELIVERY RUN #${order.orderNum}`;
    this.deliveryTotalDuration = duration;
    this.updateDeliveryProgress(order);
  }

  updateDeliveryProgress(order) {
    let html = '';
    html += `<span class="delivery-item ${order.burger === 0 ? 'done' : ''}">🍔 Burger ${order.burger === 0 ? '✓' : '1'}</span>`;
    html += `<span class="delivery-item ${order.fries === 0 ? 'done' : ''}">🍟 Fries ${order.fries === 0 ? '✓' : '1'}</span>`;
    html += `<span class="delivery-item ${order.drink === 0 ? 'done' : ''}">🥤 Drink ${order.drink === 0 ? '✓' : '1'}</span>`;
    this.deliveryItemsList.innerHTML = html;
  }

  updateDeliveryTimer(secondsRemaining) {
    this.deliveryTimerText.textContent = `${secondsRemaining}s`;
    if (this.deliveryTotalDuration) {
      const percent = (secondsRemaining / this.deliveryTotalDuration) * 100;
      this.deliveryTimerBar.style.width = `${percent}%`;
    }
  }

  hideDeliveryCard() {
    this.deliveryCard.classList.add('hidden');
  }

  showDeliverySuccessBanner(orderNum, bonus) {
    this.showFloatingToast(`🎉 ORDER #${orderNum} DELIVERED TO SELVAPURAM! +${bonus} PTS! 🎉`, '#00E676', 3000);
  }

  // --- POWER-UP BADGES ---
  updatePowerupBadges(powerups) {
    let html = '';
    if (powerups.coin_magnet && powerups.coin_magnet.active) {
      html += `<div class="powerup-badge magnet">🧲 COIN MAGNET: ${Math.ceil(powerups.coin_magnet.timer)}s</div>`;
    } else if (powerups.magnet && powerups.magnet.active) {
      html += `<div class="powerup-badge magnet">🧲 MAGNET: ${Math.ceil(powerups.magnet.timer)}s</div>`;
    }
    if (powerups.invincible && powerups.invincible.active) {
      html += `<div class="powerup-badge invincible">⭐ INVINCIBLE: ${Math.ceil(powerups.invincible.timer)}s</div>`;
    }
    if (powerups.delivery_scooter && powerups.delivery_scooter.active) {
      html += `<div class="powerup-badge scooter">🛵 WOF SCOOTER: ${Math.ceil(powerups.delivery_scooter.timer)}s</div>`;
    }
    if (powerups.shield && powerups.shield.active) {
      html += `<div class="powerup-badge shield">🛡️ SHIELD: ${Math.ceil(powerups.shield.timer)}s</div>`;
    }
    if (powerups.turbo && powerups.turbo.active) {
      html += `<div class="powerup-badge turbo">⚡ TURBO: ${Math.ceil(powerups.turbo.timer)}s</div>`;
    }
    if (powerups.burger_mode && powerups.burger_mode.active) {
      html += `<div class="powerup-badge burger">🍔 BURGER SMASH: ${Math.ceil(powerups.burger_mode.timer)}s</div>`;
    }
    this.powerupsContainer.innerHTML = html;
  }

  // --- FLOATING TOASTS ---
  showFloatingToast(text, color = '#FFFFFF', duration = 1800) {
    const toast = document.createElement('div');
    toast.className = 'floating-toast';
    toast.style.color = color;
    toast.textContent = text;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  // --- GAME OVER SUMMARY & 1,000m VOUCHER GENERATOR ---
  showGameOverScreen(stats) {
    this.lastStats = stats;
    const isNewBest = stats.score > this.highScore && stats.score > 0;
    this.saveHighScore(stats.score);

    this.finalScore.textContent = stats.score.toLocaleString();
    this.finalDistance.textContent = `${stats.distance} m`;
    if (this.finalCoins) {
      this.finalCoins.textContent = (stats.coins || 0).toLocaleString();
    }
    this.finalMeals.textContent = stats.meals;
    this.finalDeliveries.textContent = stats.deliveries;
    this.finalEasterEggs.textContent = stats.easterEggs;

    if (this.newHighScoreBanner) {
      if (isNewBest) {
        this.newHighScoreBanner.classList.remove('hidden');
      } else {
        this.newHighScoreBanner.classList.add('hidden');
      }
    }

    // Reset Lead form
    if (this.playerNameInput) this.playerNameInput.value = '';
    if (this.playerPhoneInput) this.playerPhoneInput.value = '';
    if (this.submitFeedbackMsg) {
      this.submitFeedbackMsg.className = 'submit-feedback hidden';
      this.submitFeedbackMsg.textContent = '';
    }
    if (this.submitScoreBtn) {
      this.submitScoreBtn.disabled = false;
      this.submitScoreBtn.textContent = 'SAVE RUN & RECORD PHONE ▶';
    }

    // Generate Voucher ONLY if distance >= 1000m!
    this.generateVoucher(stats.distance, stats.score);

    this.gameOverScreen.classList.remove('hidden');
  }

  generateVoucher(distance, score) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const stats = this.lastStats || { distance, score, meals: 0, deliveries: 0 };
    const deliveries = stats.deliveries || 0;
    const meals = stats.meals || 0;

    // Retrieve active offers
    const allOffers = (this.offersCache && this.offersCache.length > 0)
      ? this.offersCache
      : this.getLocalOffers();
    const activeOffers = (allOffers || []).filter(o => o.active !== false);

    // Check unlocked offers based on condition types (distance, score, deliveries, meals)
    const unlockedOffers = activeOffers.filter(o => {
      const type = (o.conditionType || o.type || 'distance').toLowerCase();
      const thresh = Number(o.threshold) || 0;
      if (type === 'distance') return distance >= thresh;
      if (type === 'score') return score >= thresh;
      if (type === 'deliveries') return deliveries >= thresh;
      if (type === 'meals') return meals >= thresh;
      return false;
    });

    if (unlockedOffers.length > 0) {
      // Prioritize: rank by highest threshold
      unlockedOffers.sort((a, b) => (Number(b.threshold) || 0) - (Number(a.threshold) || 0));
      const bestOffer = unlockedOffers[0];
      const prefix = (bestOffer.codePrefix || bestOffer.prefix || 'WOF-REWARD').toUpperCase();
      const code = `${prefix}-${randomSuffix}`;
      const minOrderNote = (bestOffer.minOrder && Number(bestOffer.minOrder) > 0)
        ? ` (Min order ₹${bestOffer.minOrder})`
        : '';
      const discount = `${bestOffer.reward}${minOrderNote}`;

      this.currentVoucher = {
        code,
        title: bestOffer.title,
        discount
      };

      this.voucherHeader.textContent = '🎉 WOF MILESTONE REWARD UNLOCKED!';
      this.voucherProgressBox.classList.add('hidden');
      this.voucherCodeRow.classList.remove('hidden');
      this.voucherTitle.textContent = bestOffer.title;
      this.voucherCode.textContent = code;
      this.voucherDiscount.textContent = discount;
      this.voucherNote.textContent = bestOffer.description || 'Redeem online at woffoods.in or at Selvapuram outlet!';
    } else {
      // Find closest distance milestone offer to motivate player
      const distanceOffers = activeOffers.filter(o => (o.conditionType || o.type || 'distance') === 'distance');
      distanceOffers.sort((a, b) => (Number(a.threshold) || 0) - (Number(b.threshold) || 0));
      const nextOffer = distanceOffers.find(o => Number(o.threshold) > distance) || distanceOffers[0] || {
        title: 'REACH 1,000 METERS TO UNLOCK',
        threshold: 1000,
        reward: 'Run at least 1,000m to unlock exclusive WOF discounts & Free Fries!'
      };

      const targetDist = Number(nextOffer.threshold) || 1000;
      const progressPercent = Math.min(100, Math.floor((distance / targetDist) * 100));

      this.currentVoucher = null;
      this.voucherHeader.textContent = '🔒 WOF COUPON LOCKED';
      this.voucherTitle.textContent = `REACH ${targetDist.toLocaleString()}m: ${nextOffer.title}`;
      this.voucherDiscount.textContent = nextOffer.reward;

      // Show Progress Bar
      this.voucherProgressBox.classList.remove('hidden');
      this.voucherCodeRow.classList.add('hidden');
      this.voucherDistText.textContent = `${distance}m / ${targetDist.toLocaleString()}m`;
      this.voucherProgressFill.style.width = `${progressPercent}%`;
      this.voucherDistRem.textContent = `${Math.max(0, targetDist - distance)}m`;
      this.voucherNote.textContent = 'Keep playing! Cross milestone goals to win authentic WOF food vouchers.';
    }
  }

  // --- LEAD REGISTRATION (Name + Phone) ---
  handleSubmitLead() {
    const name = (this.playerNameInput ? this.playerNameInput.value.trim() : '') || 'Kovai Runner';
    const rawPhone = this.playerPhoneInput ? this.playerPhoneInput.value.trim().replace(/[^\d]/g, '') : '';

    if (rawPhone.length !== 10) {
      this.showSubmitFeedback('Please enter a valid 10-digit mobile number!', 'error');
      if (this.playerPhoneInput) this.playerPhoneInput.focus();
      return;
    }

    const leadData = {
      id: 'L-' + Date.now().toString().slice(-6),
      name: name.slice(0, 30),
      phone: rawPhone,
      score: this.lastStats.score,
      distance: this.lastStats.distance,
      coins: this.lastStats.coins || 0,
      meals: this.lastStats.meals,
      deliveries: this.lastStats.deliveries,
      couponCode: this.currentVoucher ? this.currentVoucher.code : null,
      couponTitle: this.currentVoucher ? this.currentVoucher.title : 'None (< 1,000m)',
      couponDiscount: this.currentVoucher ? this.currentVoucher.discount : `Ran ${this.lastStats.distance}m (Goal: 1,000m)`,
      redeemed: false,
      timestamp: new Date().toISOString()
    };

    // Save lead in localStorage
    this.saveLeadLocally(leadData);

    // Also send POST /api/leads to server
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData)
    }).catch(() => {});

    // Save to leaderboard
    this.addLeaderboardEntry(`${name} (${rawPhone.slice(-4)})`, this.lastStats.score);

    this.showSubmitFeedback('RUN & PHONE SAVED! ✓ View in Admin Console (🔑)', 'success');
    if (this.submitScoreBtn) {
      this.submitScoreBtn.disabled = true;
      this.submitScoreBtn.textContent = 'SAVED ✓';
    }
  }

  showSubmitFeedback(msg, type) {
    if (!this.submitFeedbackMsg) return;
    this.submitFeedbackMsg.textContent = msg;
    this.submitFeedbackMsg.className = `submit-feedback ${type}`;
    this.submitFeedbackMsg.classList.remove('hidden');
  }

  saveLeadLocally(lead) {
    try {
      const local = JSON.parse(localStorage.getItem('wof_rush_admin_leads') || '[]');
      local.unshift(lead);
      localStorage.setItem('wof_rush_admin_leads', JSON.stringify(local.slice(0, 50)));
    } catch (e) {}
  }

  // --- ADMIN MARKETING CONSOLE ---
  openAdminConsole() {
    this.adminModal.classList.remove('hidden');
    if (this.isAdminAuthenticated) {
      this.showAdminDashboard();
    } else {
      this.adminAuthGate.classList.remove('hidden');
      this.adminDashboardView.classList.add('hidden');
      if (this.adminPassInput) {
        this.adminPassInput.value = '';
        this.adminPassInput.focus();
      }
    }
  }

  handleAdminLogin() {
    const inputPin = this.adminPassInput ? this.adminPassInput.value.trim() : '';
    // Passcode: wof2026 or admin
    if (inputPin === 'wof2026' || inputPin === 'admin') {
      this.isAdminAuthenticated = true;
      if (this.adminAuthErr) this.adminAuthErr.classList.add('hidden');
      this.showAdminDashboard();
    } else {
      if (this.adminAuthErr) this.adminAuthErr.classList.remove('hidden');
    }
  }

  showAdminDashboard() {
    this.adminAuthGate.classList.add('hidden');
    this.adminDashboardView.classList.remove('hidden');
    this.switchAdminTab(this.adminActiveTab || 'items');
    this.refreshAdminData();
  }

  switchAdminTab(tabName) {
    this.adminActiveTab = tabName;
    if (this.adminTabBtns) {
      this.adminTabBtns.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    if (this.stripeNavItems) {
      this.stripeNavItems.forEach(item => {
        if (item.getAttribute('data-tab') === tabName) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }

    if (this.adminTabContents) {
      this.adminTabContents.forEach(content => {
        if (content.id === `admin-tab-${tabName}`) {
          content.classList.remove('hidden');
        } else {
          content.classList.add('hidden');
        }
      });
    }

    const crumbMap = {
      'items': 'Menu Items & Cost Tracker',
      'calculator': 'Food Cost Calculator & Recipe Formulation',
      'food-cost': 'Margin & Profit Analyzer',
      'offers': 'Milestone Offers & Rewards (CRUD)',
      'leads': 'Customer Leads & Redemptions'
    };
    if (this.stripeActiveCrumb) {
      this.stripeActiveCrumb.textContent = crumbMap[tabName] || 'Overview';
    }

    if (this.topbarQuickActionBtn) {
      if (tabName === 'items') this.topbarQuickActionBtn.textContent = '+ ADD ITEM';
      else if (tabName === 'calculator') this.topbarQuickActionBtn.textContent = '💾 SAVE TO MENU';
      else if (tabName === 'offers') this.topbarQuickActionBtn.textContent = '+ CREATE OFFER';
      else if (tabName === 'food-cost') this.topbarQuickActionBtn.textContent = '🎛️ SIMULATOR';
      else if (tabName === 'leads') this.topbarQuickActionBtn.textContent = '📥 EXPORT CSV';
    }

    if (tabName === 'items') {
      this.renderItemsView();
    } else if (tabName === 'calculator') {
      if (!this.rawMaterials || this.rawMaterials.length === 0) {
        if (this.calcRecipeSelect && this.calcRecipeSelect.value) {
          this.pullRecipeIntoCalculator(this.calcRecipeSelect.value);
        } else {
          this.pullRecipeIntoCalculator('rec-ff-01');
        }
      } else {
        this.recalculateRawMaterialsFoodCost();
      }
    } else if (tabName === 'food-cost') {
      this.updateFoodCostSimulation();
      this.calculatePeriodFoodCost();
      this.renderMenuEngineeringMatrix();
    } else if (tabName === 'offers') {
      this.renderOffersView();
    } else if (tabName === 'leads') {
      this.renderAdminView();
    }
  }

  refreshAdminData() {
    // 1. Leads
    fetch('/api/leads')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.leads)) {
          this.adminLeadsCache = this.mergeLeads(data.leads);
        } else {
          this.adminLeadsCache = this.getLocalLeads();
        }
        if (this.adminActiveTab === 'leads') this.renderAdminView();
        if (this.navCountLeads) this.navCountLeads.textContent = (this.adminLeadsCache || []).length;
      })
      .catch(() => {
        this.adminLeadsCache = this.getLocalLeads();
        if (this.adminActiveTab === 'leads') this.renderAdminView();
        if (this.navCountLeads) this.navCountLeads.textContent = (this.adminLeadsCache || []).length;
      });

    // 2. Menu Items
    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.items) && data.items.length > 0) {
          this.menuItemsCache = data.items;
          this.saveItemsLocally(this.menuItemsCache);
        } else {
          this.menuItemsCache = this.getLocalItems();
        }
        this.updatePresetSelector();
        this.renderItemsView();
        this.renderMenuEngineeringMatrix();
        if (this.navCountItems) this.navCountItems.textContent = (this.menuItemsCache || []).length;
      })
      .catch(() => {
        this.menuItemsCache = this.getLocalItems();
        this.updatePresetSelector();
        this.renderItemsView();
        this.renderMenuEngineeringMatrix();
        if (this.navCountItems) this.navCountItems.textContent = (this.menuItemsCache || []).length;
      });

    // 3. Milestone Offers (CRUD)
    fetch('/api/offers')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.offers) && data.offers.length > 0) {
          this.offersCache = data.offers;
          this.saveOffersLocally(this.offersCache);
        } else {
          this.offersCache = this.getLocalOffers();
        }
        this.renderOffersView();
        if (this.navCountOffers) this.navCountOffers.textContent = (this.offersCache || []).filter(o => o.active !== false).length;
      })
      .catch(() => {
        this.offersCache = this.getLocalOffers();
        this.renderOffersView();
        if (this.navCountOffers) this.navCountOffers.textContent = (this.offersCache || []).filter(o => o.active !== false).length;
      });

    // 4. Standard Recipes for Recipe Puller
    fetch('/api/recipes')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.recipes) && data.recipes.length > 0) {
          this.recipesCache = data.recipes;
          this.populateRecipeSelect();
        }
      })
      .catch(() => {});
  }

  // --- MENU ITEMS MANAGEMENT & COST TRACKER ---
  initMenuItems() {
    this.menuItemsCache = this.getLocalItems();
    this.updatePresetSelector();
    this.initOffers();
    this.initRecipePuller();
    this.initCostCalculator();
    this.initFoodCostAnalyzer();
  }

  getDefaultMenuItemsList() {
    return [
      {
        id: "item-101",
        name: "WOF Classic Burger",
        category: "main",
        icon: "🍔",
        price: 149,
        cost: 44.50,
        foodCost: 39.50,
        packagingCost: 5.00,
        portion: "1 burger / 220g",
        popularity: 1450,
        targetFoodCostPct: 30,
        ingredients: [
          { name: "Burger Bun (Sesame)", packCost: 60, packQty: 6, packUnit: "pcs", portionQty: 1, calculatedCost: 10.00 },
          { name: "Seasoned Veg/Chicken Patty", packCost: 220, packQty: 1000, packUnit: "g", portionQty: 100, calculatedCost: 22.00 },
          { name: "WOF Signature Mayo Sauce", packCost: 180, packQty: 1000, packUnit: "g", portionQty: 25, calculatedCost: 4.50 },
          { name: "Crisp Iceberg & Tomato", packCost: 100, packQty: 1000, packUnit: "g", portionQty: 30, calculatedCost: 3.00 }
        ]
      },
      {
        id: "item-102",
        name: "Double Smash Burger",
        category: "main",
        icon: "🍔",
        price: 249,
        cost: 76.50,
        foodCost: 70.50,
        packagingCost: 6.00,
        portion: "Double Patty / 320g",
        popularity: 980,
        targetFoodCostPct: 30,
        ingredients: [
          { name: "Brioche Bun", packCost: 90, packQty: 6, packUnit: "pcs", portionQty: 1, calculatedCost: 15.00 },
          { name: "Smash Patties (2x90g)", packCost: 220, packQty: 1000, packUnit: "g", portionQty: 180, calculatedCost: 39.60 },
          { name: "Cheddar Cheese Slices (2x)", packCost: 200, packQty: 20, packUnit: "pcs", portionQty: 2, calculatedCost: 20.00 },
          { name: "Caramelized Onion & Relish", packCost: 160, packQty: 1000, packUnit: "g", portionQty: 30, calculatedCost: 4.80 }
        ]
      },
      {
        id: "item-103",
        name: "Crispy Chicken Burger",
        category: "main",
        icon: "🍔",
        price: 189,
        cost: 54.00,
        foodCost: 49.00,
        packagingCost: 5.00,
        portion: "1 burger / 240g",
        popularity: 1650,
        targetFoodCostPct: 28,
        ingredients: [
          { name: "Sesame Bun", packCost: 66, packQty: 6, packUnit: "pcs", portionQty: 1, calculatedCost: 11.00 },
          { name: "Crispy Marinated Chicken Fillet", packCost: 260, packQty: 1000, packUnit: "g", portionQty: 120, calculatedCost: 31.20 },
          { name: "Spicy Slaw & Garlic Mayo", packCost: 180, packQty: 1000, packUnit: "g", portionQty: 25, calculatedCost: 4.50 },
          { name: "Dill Pickles / Jalapenos", packCost: 140, packQty: 1000, packUnit: "g", portionQty: 15, calculatedCost: 2.10 }
        ]
      },
      {
        id: "item-104",
        name: "Margherita Pizza (8\")",
        category: "main",
        icon: "🍕",
        price: 199,
        cost: 43.50,
        foodCost: 38.50,
        packagingCost: 5.00,
        portion: "8 inch (4 slices)",
        popularity: 720,
        targetFoodCostPct: 22,
        ingredients: [
          { name: "Hand-Tossed Dough Base 8\"", packCost: 120, packQty: 10, packUnit: "pcs", portionQty: 1, calculatedCost: 12.00 },
          { name: "San Marzano Pizza Sauce", packCost: 140, packQty: 1000, packUnit: "g", portionQty: 50, calculatedCost: 7.00 },
          { name: "Diced Mozzarella Blend", packCost: 450, packQty: 1000, packUnit: "g", portionQty: 80, calculatedCost: 36.00 },
          { name: "Oregano & Olive Oil", packCost: 150, packQty: 1000, packUnit: "g", portionQty: 10, calculatedCost: 1.50 }
        ]
      },
      {
        id: "item-105",
        name: "Chicken Pepperoni Pizza (8\")",
        category: "main",
        icon: "🍕",
        price: 299,
        cost: 74.00,
        foodCost: 68.50,
        packagingCost: 5.50,
        portion: "8 inch (4 slices)",
        popularity: 580,
        targetFoodCostPct: 25,
        ingredients: [
          { name: "Dough Base 8\"", packCost: 120, packQty: 10, packUnit: "pcs", portionQty: 1, calculatedCost: 12.00 },
          { name: "Pizza Sauce", packCost: 140, packQty: 1000, packUnit: "g", portionQty: 50, calculatedCost: 7.00 },
          { name: "Mozzarella Cheese", packCost: 450, packQty: 1000, packUnit: "g", portionQty: 80, calculatedCost: 36.00 },
          { name: "Chicken Pepperoni Slices", packCost: 400, packQty: 500, packUnit: "g", portionQty: 45, calculatedCost: 36.00 }
        ]
      },
      {
        id: "item-106",
        name: "Kovai Paneer Tikka Wrap",
        category: "main",
        icon: "🌯",
        price: 159,
        cost: 47.00,
        foodCost: 43.00,
        packagingCost: 4.00,
        portion: "1 wrap / 210g",
        popularity: 890,
        targetFoodCostPct: 30,
        ingredients: [
          { name: "Parotta / Wrap Base", packCost: 90, packQty: 10, packUnit: "pcs", portionQty: 1, calculatedCost: 9.00 },
          { name: "Marinated Paneer Tikka", packCost: 360, packQty: 1000, packUnit: "g", portionQty: 85, calculatedCost: 30.60 },
          { name: "Mint Chutney & Mayo", packCost: 150, packQty: 1000, packUnit: "g", portionQty: 25, calculatedCost: 3.75 },
          { name: "Sauteed Onion & Capsicum", packCost: 50, packQty: 1000, packUnit: "g", portionQty: 30, calculatedCost: 1.50 }
        ]
      },
      {
        id: "item-107",
        name: "Crispy French Fries (Regular)",
        category: "side",
        icon: "🍟",
        price: 89,
        cost: 18.50,
        foodCost: 15.00,
        packagingCost: 3.50,
        portion: "130g portion",
        popularity: 2100,
        targetFoodCostPct: 20,
        ingredients: [
          { name: "Imported Cut Shoestring Fries", packCost: 120, packQty: 1000, packUnit: "g", portionQty: 130, calculatedCost: 15.60 },
          { name: "Frying Oil Absorption", packCost: 140, packQty: 1000, packUnit: "ml", portionQty: 15, calculatedCost: 2.10 },
          { name: "Fine Sea Salt & Paprika", packCost: 80, packQty: 1000, packUnit: "g", portionQty: 10, calculatedCost: 0.80 }
        ]
      },
      {
        id: "item-108",
        name: "Peri-Peri Loaded Fries",
        category: "side",
        icon: "🍟",
        price: 139,
        cost: 36.50,
        foodCost: 31.50,
        packagingCost: 5.00,
        portion: "200g tray",
        popularity: 1320,
        targetFoodCostPct: 26,
        ingredients: [
          { name: "Crispy French Fries", packCost: 120, packQty: 1000, packUnit: "g", portionQty: 160, calculatedCost: 19.20 },
          { name: "Warm Cheese Sauce", packCost: 280, packQty: 1000, packUnit: "g", portionQty: 40, calculatedCost: 11.20 },
          { name: "Peri-Peri Spice Dust", packCost: 180, packQty: 500, packUnit: "g", portionQty: 8, calculatedCost: 2.88 },
          { name: "Pickled Jalapenos", packCost: 160, packQty: 500, packUnit: "g", portionQty: 15, calculatedCost: 4.80 }
        ]
      },
      {
        id: "item-109",
        name: "Golden Belgium Waffle",
        category: "side",
        icon: "🧇",
        price: 129,
        cost: 28.50,
        foodCost: 24.50,
        packagingCost: 4.00,
        portion: "1 round waffle",
        popularity: 640,
        targetFoodCostPct: 22,
        ingredients: [
          { name: "Waffle Batter Premix", packCost: 140, packQty: 1000, packUnit: "g", portionQty: 80, calculatedCost: 11.20 },
          { name: "Butter & Milk Blend", packCost: 120, packQty: 1000, packUnit: "g", portionQty: 50, calculatedCost: 6.00 },
          { name: "Belgian Chocolate Syrup Drizzle", packCost: 220, packQty: 1000, packUnit: "g", portionQty: 30, calculatedCost: 6.60 }
        ]
      },
      {
        id: "item-110",
        name: "Kovai Falooda Shake",
        category: "drink",
        icon: "🧋",
        price: 119,
        cost: 28.00,
        foodCost: 23.50,
        packagingCost: 4.50,
        portion: "350ml cup",
        popularity: 1150,
        targetFoodCostPct: 24,
        ingredients: [
          { name: "Fresh Chilled Milk", packCost: 55, packQty: 1000, packUnit: "ml", portionQty: 200, calculatedCost: 11.00 },
          { name: "Rose Syrup & Soaked Sabja", packCost: 90, packQty: 1000, packUnit: "ml", portionQty: 50, calculatedCost: 4.50 },
          { name: "Falooda Sev", packCost: 80, packQty: 1000, packUnit: "g", portionQty: 30, calculatedCost: 2.40 },
          { name: "Vanilla Ice Cream Scoop", packCost: 200, packQty: 1000, packUnit: "ml", portionQty: 50, calculatedCost: 10.00 }
        ]
      },
      {
        id: "item-111",
        name: "Fizzy Soda / Cola (400ml)",
        category: "drink",
        icon: "🥤",
        price: 49,
        cost: 11.50,
        foodCost: 7.50,
        packagingCost: 4.00,
        portion: "400ml cup",
        popularity: 1850,
        targetFoodCostPct: 23,
        ingredients: [
          { name: "Postmix Cola Syrup & Soda", packCost: 175, packQty: 10000, packUnit: "ml", portionQty: 400, calculatedCost: 7.00 },
          { name: "Purified Filtered Ice", packCost: 20, packQty: 5000, packUnit: "g", portionQty: 150, calculatedCost: 0.60 }
        ]
      },
      {
        id: "item-112",
        name: "WOF Trio Feast Combo",
        category: "combo",
        icon: "🎁",
        price: 299,
        cost: 78.50,
        foodCost: 71.00,
        packagingCost: 7.50,
        portion: "Burger + Fries + Soda",
        popularity: 1580,
        targetFoodCostPct: 26,
        ingredients: [
          { name: "Classic Burger Components", packCost: 1, packQty: 1, packUnit: "pcs", portionQty: 1, calculatedCost: 44.50 },
          { name: "Medium Fries Components", packCost: 1, packQty: 1, packUnit: "pcs", portionQty: 1, calculatedCost: 16.00 },
          { name: "Fountain Drink Components", packCost: 1, packQty: 1, packUnit: "pcs", portionQty: 1, calculatedCost: 8.00 }
        ]
      }
    ];
  }

  getLocalItems() {
    try {
      const raw = localStorage.getItem('wof_rush_menu_items');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    const defaults = this.getDefaultMenuItemsList();
    this.saveItemsLocally(defaults);
    return defaults;
  }

  saveItemsLocally(items) {
    try {
      localStorage.setItem('wof_rush_menu_items', JSON.stringify(items));
    } catch (e) {}
  }

  updatePresetSelector() {
    if (!this.calcPresetSelect) return;
    const currentVal = this.calcPresetSelect.value;
    let html = '';
    this.menuItemsCache.forEach(item => {
      html += `<option value="${item.id}">${item.icon || '🍔'} ${item.name}</option>`;
    });
    html += `<option value="blank">✨ Blank Custom Recipe Formulation</option>`;
    this.calcPresetSelect.innerHTML = html;
    if (currentVal && [...this.calcPresetSelect.options].some(o => o.value === currentVal)) {
      this.calcPresetSelect.value = currentVal;
    }
  }

  renderItemsView() {
    const items = this.menuItemsCache;
    const totalCount = items.length;

    if (totalCount > 0) {
      const totalCostPct = items.reduce((sum, it) => sum + (it.price > 0 ? (it.cost / it.price) * 100 : 0), 0);
      const avgFoodCost = totalCostPct / totalCount;
      const avgPrice = items.reduce((sum, it) => sum + (it.price || 0), 0) / totalCount;
      const avgMargin = 100 - avgFoodCost;

      if (this.kpiTotalItems) this.kpiTotalItems.textContent = totalCount;
      if (this.kpiAvgFoodCost) {
        this.kpiAvgFoodCost.textContent = `${avgFoodCost.toFixed(1)}%`;
        this.kpiAvgFoodCost.style.color = avgFoodCost < 30 ? '#00E676' : (avgFoodCost <= 35 ? '#FFD000' : '#FF5252');
      }
      if (this.kpiAvgPrice) this.kpiAvgPrice.textContent = `₹${Math.round(avgPrice)}`;
      if (this.kpiAvgMargin) this.kpiAvgMargin.textContent = `${avgMargin.toFixed(1)}%`;
    }

    // Category Counts
    const mainCount = items.filter(it => it.category === 'main').length;
    const sideCount = items.filter(it => it.category === 'side').length;
    const drinkCount = items.filter(it => it.category === 'drink').length;
    const comboCount = items.filter(it => it.category === 'combo').length;

    const elCountAll = document.getElementById('cat-count-all');
    const elCountMain = document.getElementById('cat-count-main');
    const elCountSide = document.getElementById('cat-count-side');
    const elCountDrink = document.getElementById('cat-count-drink');
    const elCountCombo = document.getElementById('cat-count-combo');

    if (elCountAll) elCountAll.textContent = totalCount;
    if (elCountMain) elCountMain.textContent = mainCount;
    if (elCountSide) elCountSide.textContent = sideCount;
    if (elCountDrink) elCountDrink.textContent = drinkCount;
    if (elCountCombo) elCountCombo.textContent = comboCount;

    this.filterItemsTable();
  }

  filterItemsTable() {
    let filtered = [...this.menuItemsCache];

    // Category filter
    if (this.currentCategoryFilter && this.currentCategoryFilter !== 'all') {
      filtered = filtered.filter(it => it.category === this.currentCategoryFilter);
    }

    // Health filter
    const healthVal = this.adminItemsHealthFilter ? this.adminItemsHealthFilter.value : 'all';
    if (healthVal === 'healthy') {
      filtered = filtered.filter(it => (it.price > 0 ? (it.cost / it.price) * 100 : 0) < 30);
    } else if (healthVal === 'moderate') {
      filtered = filtered.filter(it => {
        const fc = it.price > 0 ? (it.cost / it.price) * 100 : 0;
        return fc >= 30 && fc <= 35;
      });
    } else if (healthVal === 'warning') {
      filtered = filtered.filter(it => (it.price > 0 ? (it.cost / it.price) * 100 : 0) > 35);
    }

    // Search input
    const query = this.adminItemsSearchInput ? this.adminItemsSearchInput.value.toLowerCase().trim() : '';
    if (query) {
      filtered = filtered.filter(it =>
        it.name.toLowerCase().includes(query) ||
        (it.portion && it.portion.toLowerCase().includes(query)) ||
        it.category.toLowerCase().includes(query) ||
        (Array.isArray(it.ingredients) && it.ingredients.some(ing => ing.name.toLowerCase().includes(query)))
      );
    }

    // Sorting
    const sortVal = this.adminItemsSortSelect ? this.adminItemsSortSelect.value : 'margin-desc';
    filtered.sort((a, b) => {
      const fcA = a.price > 0 ? (a.cost / a.price) * 100 : 0;
      const fcB = b.price > 0 ? (b.cost / b.price) * 100 : 0;
      const marginA = 100 - fcA;
      const marginB = 100 - fcB;

      if (sortVal === 'margin-desc') return marginB - marginA;
      if (sortVal === 'foodcost-asc') return fcA - fcB;
      if (sortVal === 'price-desc') return b.price - a.price;
      if (sortVal === 'price-asc') return a.price - b.price;
      if (sortVal === 'cost-desc') return b.cost - a.cost;
      if (sortVal === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });

    this.renderItemsTable(filtered);
  }

  renderItemsTable(items) {
    if (!this.adminItemsTbody) return;

    if (items.length === 0) {
      this.adminItemsTbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:24px; color:#90A4AE;">No items match the current filters. Click "+ Add Item" to create one!</td></tr>`;
      return;
    }

    let html = '';
    items.forEach(it => {
      const price = Number(it.price) || 0;
      const cost = Number(it.cost) || 0;
      const grossProfit = price - cost;
      const foodCostPct = price > 0 ? (cost / price) * 100 : 0;
      const marginPct = price > 0 ? (grossProfit / price) * 100 : 0;
      const markup = cost > 0 ? (price / cost) : 0;

      let healthBadge = '';
      if (foodCostPct < 30) {
        healthBadge = `<span class="cost-badge healthy">🟢 ${foodCostPct.toFixed(1)}% Optimal</span>`;
      } else if (foodCostPct <= 35) {
        healthBadge = `<span class="cost-badge moderate">🟡 ${foodCostPct.toFixed(1)}% Moderate</span>`;
      } else {
        healthBadge = `<span class="cost-badge warning">🔴 ${foodCostPct.toFixed(1)}% High Cost</span>`;
      }

      html += `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:20px;">${it.icon || '🍔'}</span>
              <div>
                <b>${it.name}</b>
              </div>
            </div>
          </td>
          <td><span class="category-tag ${it.category}">${it.category.toUpperCase()}</span></td>
          <td style="color:#90A4AE; font-size:11px;">${it.portion || '1 portion'}</td>
          <td><b>₹${price}</b></td>
          <td style="color:#FFB74D;">₹${cost.toFixed(2)}</td>
          <td style="color:#00E676; font-weight:800;">₹${grossProfit.toFixed(2)}</td>
          <td><b>${foodCostPct.toFixed(1)}%</b></td>
          <td style="color:${marginPct >= 70 ? '#00E676' : '#FFD000'}; font-weight:800;">${marginPct.toFixed(1)}%</td>
          <td style="color:var(--wof-cyan); font-weight:700;">${markup.toFixed(2)}x</td>
          <td>${healthBadge}</td>
          <td>
            <div style="display:flex; align-items:center;">
              <button class="items-action-btn" onclick="window.uiManager.openInRecipeCalculator('${it.id}')" title="Formulate Recipe Ingredients in Calculator">🧮 Recipe</button>
              <button class="items-action-btn" onclick="window.uiManager.openAddItemModal('${it.id}')" title="Quick Edit Item">✏️</button>
              <button class="items-action-btn delete" onclick="window.uiManager.deleteMenuItem('${it.id}')" title="Delete Item">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    });

    this.adminItemsTbody.innerHTML = html;
  }

  openInRecipeCalculator(itemId) {
    this.switchAdminTab('calculator');
    this.loadRecipePreset(itemId);
    if (this.calcPresetSelect) this.calcPresetSelect.value = itemId;
  }

  exportItemsToCSV() {
    const items = this.menuItemsCache;
    if (items.length === 0) {
      alert('No menu items available to export.');
      return;
    }

    const headers = ['Item ID', 'Item Name', 'Category', 'Portion', 'Selling Price (INR)', 'Food & Packaging Cost (INR)', 'Gross Profit (INR)', 'Food Cost %', 'Gross Margin %', 'Markup Multiplier', 'Health Status', 'Monthly Units Sold'];
    const rows = items.map(it => {
      const price = Number(it.price) || 0;
      const cost = Number(it.cost) || 0;
      const grossProfit = price - cost;
      const fcPct = price > 0 ? ((cost / price) * 100).toFixed(1) : '0';
      const marginPct = price > 0 ? ((grossProfit / price) * 100).toFixed(1) : '0';
      const markup = cost > 0 ? (price / cost).toFixed(2) : '0';
      const status = Number(fcPct) < 30 ? 'Optimal' : (Number(fcPct) <= 35 ? 'Moderate' : 'High Food Cost');

      return [
        it.id,
        `"${it.name.replace(/"/g, '""')}"`,
        it.category,
        `"${(it.portion || '').replace(/"/g, '""')}"`,
        price,
        cost.toFixed(2),
        grossProfit.toFixed(2),
        fcPct,
        marginPct,
        markup,
        status,
        it.popularity || 0
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `WOF_Menu_Cost_Tracker_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // --- ADD / EDIT ITEM MODAL ---
  openAddItemModal(itemId = null) {
    if (!this.adminItemSubmodal) return;
    this.adminItemSubmodal.classList.remove('hidden');

    const modalTitle = document.getElementById('item-modal-title');
    if (itemId) {
      const item = this.menuItemsCache.find(it => it.id === itemId);
      if (item) {
        if (modalTitle) modalTitle.textContent = `✏️ EDIT: ${item.name.toUpperCase()}`;
        if (this.editItemId) this.editItemId.value = item.id;
        if (this.editItemName) this.editItemName.value = item.name;
        if (this.editItemCategory) this.editItemCategory.value = item.category;
        if (this.editItemIcon) this.editItemIcon.value = item.icon || '🍔';
        if (this.editItemPrice) this.editItemPrice.value = item.price;
        if (this.editItemCost) this.editItemCost.value = item.cost;
        if (this.editItemPortion) this.editItemPortion.value = item.portion || '';
        if (this.editItemPopularity) this.editItemPopularity.value = item.popularity || 800;
        if (this.editItemTargetFc) this.editItemTargetFc.value = item.targetFoodCostPct || 30;
        this.updateItemModalPreview();
        return;
      }
    }

    // New blank item
    if (modalTitle) modalTitle.textContent = '+ ADD CUSTOM MENU ITEM';
    if (this.editItemId) this.editItemId.value = '';
    if (this.editItemName) this.editItemName.value = '';
    if (this.editItemCategory) this.editItemCategory.value = 'main';
    if (this.editItemIcon) this.editItemIcon.value = '🍔';
    if (this.editItemPrice) this.editItemPrice.value = '149';
    if (this.editItemCost) this.editItemCost.value = '42.00';
    if (this.editItemPortion) this.editItemPortion.value = '1 serving';
    if (this.editItemPopularity) this.editItemPopularity.value = '800';
    if (this.editItemTargetFc) this.editItemTargetFc.value = '30';
    this.updateItemModalPreview();
  }

  closeAddItemModal() {
    if (this.adminItemSubmodal) this.adminItemSubmodal.classList.add('hidden');
  }

  updateItemModalPreview() {
    const price = parseFloat(this.editItemPrice ? this.editItemPrice.value : 0) || 0;
    const cost = parseFloat(this.editItemCost ? this.editItemCost.value : 0) || 0;
    const fcPct = price > 0 ? (cost / price) * 100 : 0;
    const marginPct = price > 0 ? ((price - cost) / price) * 100 : 0;

    if (this.editItemFcPreview) {
      this.editItemFcPreview.textContent = `${fcPct.toFixed(1)}%`;
      this.editItemFcPreview.style.color = fcPct < 30 ? '#00E676' : (fcPct <= 35 ? '#FFD000' : '#FF5252');
    }
    if (this.editItemMarginPreview) {
      this.editItemMarginPreview.textContent = `${marginPct.toFixed(1)}% (₹${(price - cost).toFixed(2)})`;
    }
  }

  handleSaveItemSubmodal() {
    const name = this.editItemName ? this.editItemName.value.trim() : '';
    if (!name) {
      alert('Please enter an item name');
      return;
    }

    const price = parseFloat(this.editItemPrice.value) || 0;
    const cost = parseFloat(this.editItemCost.value) || 0;
    const targetId = this.editItemId ? this.editItemId.value : '';

    const itemData = {
      id: targetId || ('item-' + Date.now().toString().slice(-6)),
      name: name.slice(0, 50),
      category: this.editItemCategory ? this.editItemCategory.value : 'main',
      icon: (this.editItemIcon ? this.editItemIcon.value.trim() : '') || '🍔',
      price: price,
      cost: cost,
      foodCost: Math.max(0, cost - 5),
      packagingCost: 5.00,
      portion: this.editItemPortion ? this.editItemPortion.value.trim() : '1 portion',
      popularity: parseInt(this.editItemPopularity ? this.editItemPopularity.value : 800, 10) || 800,
      targetFoodCostPct: parseFloat(this.editItemTargetFc ? this.editItemTargetFc.value : 30) || 30,
      ingredients: []
    };

    // Update in local cache
    const existingIdx = targetId ? this.menuItemsCache.findIndex(it => it.id === targetId) : -1;
    if (existingIdx >= 0) {
      itemData.ingredients = this.menuItemsCache[existingIdx].ingredients || [];
      this.menuItemsCache[existingIdx] = itemData;
    } else {
      this.menuItemsCache.push(itemData);
    }

    this.saveItemsLocally(this.menuItemsCache);

    // Send to server API
    fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    }).catch(() => {});

    this.closeAddItemModal();
    this.updatePresetSelector();
    this.renderItemsView();
    this.renderMenuEngineeringMatrix();
    this.showFloatingToast(`Item "${itemData.name}" saved! ✓`, '#00E676', 2200);
  }

  deleteMenuItem(itemId) {
    const item = this.menuItemsCache.find(it => it.id === itemId);
    const itemName = item ? item.name : 'item';
    if (!confirm(`Are you sure you want to delete "${itemName}" from the cost tracker?`)) return;

    this.menuItemsCache = this.menuItemsCache.filter(it => it.id !== itemId);
    this.saveItemsLocally(this.menuItemsCache);

    fetch('/api/items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId })
    }).catch(() => {});

    this.updatePresetSelector();
    this.renderItemsView();
    this.renderMenuEngineeringMatrix();
    this.showFloatingToast(`Deleted "${itemName}"`, '#FF5252', 2000);
  }

  // =========================================================
  // TAB 2: TWO-SECTION FOOD COST CALCULATOR & RAW MATERIAL ENGINE
  // =========================================================

  initMasterRawMaterials() {
    fetch('/api/raw-materials')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.materials) && data.materials.length > 0) {
          this.masterRawMaterials = data.materials;
        } else {
          return fetch('/data/raw_materials.json').then(r => r.json());
        }
      })
      .then(fallbackData => {
        if (fallbackData && Array.isArray(fallbackData) && (!this.masterRawMaterials || this.masterRawMaterials.length === 0)) {
          this.masterRawMaterials = fallbackData;
        }
        this.renderMasterRawMaterialsTable();
        this.updateMasterMaterialKPIs();
        this.populateQuickAddDropdown();
        this.initRecipePuller();
      })
      .catch(() => {
        fetch('/data/raw_materials.json')
          .then(r => r.json())
          .then(list => {
            this.masterRawMaterials = Array.isArray(list) ? list : [];
            this.renderMasterRawMaterialsTable();
            this.updateMasterMaterialKPIs();
            this.populateQuickAddDropdown();
            this.initRecipePuller();
          })
          .catch(() => {
            this.masterRawMaterials = [];
            this.initRecipePuller();
          });
      });
  }

  initRecipePuller() {
    this.rawMaterials = [];
    fetch('/api/recipes')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.recipes) && data.recipes.length > 0) {
          this.recipesCache = data.recipes;
        } else {
          this.recipesCache = this.getDefaultRecipesList();
        }
        this.populateRecipeSelect();
        this.renderRecipeQuickChips();
        this.pullRecipeIntoCalculator('rec-ff-01');
      })
      .catch(() => {
        this.recipesCache = this.getDefaultRecipesList();
        this.populateRecipeSelect();
        this.renderRecipeQuickChips();
        this.pullRecipeIntoCalculator('rec-ff-01');
      });
  }

  initCostCalculator() {
    if (!this.masterRawMaterials || this.masterRawMaterials.length === 0) {
      this.initMasterRawMaterials();
    } else {
      this.renderMasterRawMaterialsTable();
      this.updateMasterMaterialKPIs();
      this.populateQuickAddDropdown();
      if (!this.recipesCache || this.recipesCache.length === 0) {
        this.initRecipePuller();
      }
    }
  }

  // --- SUB-VIEW SWITCHER (Split / Section 1 / Section 2) ---
  switchCalcSubView(view) {
    this.calcActiveView = view;
    if (!this.calcSection1 || !this.calcSection2) return;

    if (view === 'section1') {
      this.calcSection1.style.display = 'block';
      this.calcSection2.style.display = 'none';
    } else if (view === 'section2') {
      this.calcSection1.style.display = 'none';
      this.calcSection2.style.display = 'block';
    } else {
      // Split view (default)
      this.calcSection1.style.display = 'block';
      this.calcSection2.style.display = 'block';
    }
  }

  // --- SECTION 1: MASTER RAW MATERIALS TABLE & RATE CONTROLS ---
  renderMasterRawMaterialsTable() {
    if (!this.masterRawMaterialsTbody) return;

    let materials = [...(this.masterRawMaterials || [])];

    // Filter by Category
    if (this.activeMasterCategory && this.activeMasterCategory !== 'all') {
      materials = materials.filter(m => (m.category || '').toLowerCase() === this.activeMasterCategory.toLowerCase());
    }

    // Filter by Search Term
    if (this.masterSearchTerm) {
      const term = this.masterSearchTerm.toLowerCase();
      materials = materials.filter(m =>
        (m.name || '').toLowerCase().includes(term) ||
        (m.category || '').toLowerCase().includes(term) ||
        (m.notes || '').toLowerCase().includes(term) ||
        (m.usedInRecipes || []).some(r => r.toLowerCase().includes(term))
      );
    }

    // Sort
    const order = this.masterSortOrder || 'name-asc';
    materials.sort((a, b) => {
      if (order === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      if (order === 'rate-desc') return (b.costPerUnit || 0) - (a.costPerUnit || 0);
      if (order === 'rate-asc') return (a.costPerUnit || 0) - (b.costPerUnit || 0);
      if (order === 'recipes-desc') return (b.usedInRecipes ? b.usedInRecipes.length : 0) - (a.usedInRecipes ? a.usedInRecipes.length : 0);
      return 0;
    });

    if (materials.length === 0) {
      this.masterRawMaterialsTbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:24px; color:#94A3B8;">
            No raw materials found matching filters. Click "+ ADD RAW MATERIAL" to add one!
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    const inflationMultiplier = 1 + (this.inflationSurgePct || 0) / 100;

    materials.forEach((mat) => {
      const rate = (mat.costPerUnit !== undefined ? mat.costPerUnit : 100);
      const effectiveRate = rate * inflationMultiplier;
      const baseInfo = this.getBaseUnitRateDisplay(effectiveRate, mat.standardUnit || 'kg');

      // Category color class
      const catClass = this.getCategoryBadgeClass(mat.category);
      const recipesCount = (mat.usedInRecipes || []).length;

      html += `
        <tr data-mat-id="${mat.id}">
          <td>
            <div style="font-weight:800; color:#F8FAFC; font-size:13px;">${mat.name}</div>
            ${mat.notes ? `<div style="font-size:10px; color:#64748B;">${mat.notes}</div>` : ''}
          </td>
          <td>
            <span class="category-tag ${catClass}" style="font-size:10px;">${mat.category || 'General'}</span>
          </td>
          <td>
            <select class="calc-select mat-uom-select" data-id="${mat.id}" style="padding:4px 8px; font-size:12px; width:75px;">
              <option value="kg" ${mat.standardUnit === 'kg' ? 'selected' : ''}>kg</option>
              <option value="L" ${mat.standardUnit === 'L' ? 'selected' : ''}>L</option>
              <option value="pcs" ${mat.standardUnit === 'pcs' ? 'selected' : ''}>pcs</option>
              <option value="g" ${mat.standardUnit === 'g' ? 'selected' : ''}>g</option>
              <option value="ml" ${mat.standardUnit === 'ml' ? 'selected' : ''}>ml</option>
            </select>
          </td>
          <td>
            <div style="display:flex; align-items:center; gap:4px;">
              <span style="font-weight:800; color:#94A3B8; font-size:12px;">₹</span>
              <input type="number" class="mat-inline-rate-input" data-id="${mat.id}" value="${rate}" step="1" min="0">
              <span style="color:#64748B; font-size:11px;">/${mat.standardUnit || 'kg'}</span>
            </div>
            ${this.inflationSurgePct > 0 ? `<div style="font-size:10px; color:#F59E0B; font-weight:700;">+${this.inflationSurgePct}% = ₹${effectiveRate.toFixed(2)}</div>` : ''}
          </td>
          <td>
            <span class="mat-base-rate-badge mat-base-preview-${mat.id}">
              ${baseInfo}
            </span>
          </td>
          <td>
            ${recipesCount > 0 ? `
              <span class="mat-recipes-tag" data-recipe="${mat.usedInRecipes[0]}" title="${mat.usedInRecipes.join(', ')}">
                📖 ${recipesCount} ${recipesCount === 1 ? 'recipe' : 'recipes'}
              </span>
            ` : `<span style="color:#64748B; font-size:11px;">Not in recipe</span>`}
          </td>
          <td style="text-align:center;">
            <button class="remove-ing-btn" onclick="window.uiManager.deleteMasterMaterial('${mat.id}')" title="Delete raw material">✕</button>
          </td>
        </tr>
      `;
    });

    this.masterRawMaterialsTbody.innerHTML = html;

    // Attach inline listeners
    this.masterRawMaterialsTbody.querySelectorAll('.mat-inline-rate-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const matId = e.target.getAttribute('data-id');
        const newRate = Math.max(0, parseFloat(e.target.value) || 0);
        this.updateMasterMaterialRate(matId, newRate);
      });
    });

    this.masterRawMaterialsTbody.querySelectorAll('.mat-uom-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const matId = e.target.getAttribute('data-id');
        const newUom = e.target.value;
        this.updateMasterMaterialUom(matId, newUom);
      });
    });

    // Clicking a recipe tag loads that recipe in Section 2
    this.masterRawMaterialsTbody.querySelectorAll('.mat-recipes-tag').forEach(tag => {
      tag.addEventListener('click', (e) => {
        const recName = tag.getAttribute('data-recipe');
        const found = (this.recipesCache || []).find(r => r.name.toLowerCase() === recName.toLowerCase());
        if (found) {
          if (this.calcRecipeSelect) this.calcRecipeSelect.value = found.id;
          this.pullRecipeIntoCalculator(found.id);
          this.showFloatingToast(`Loaded recipe: ${found.name} ✓`, '#6366F1', 1800);
          if (this.calcSection2) {
            this.calcSection2.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  }

  getBaseUnitRateDisplay(rate, stdUnit) {
    if (stdUnit === 'kg') {
      const perGram = rate / 1000;
      return `₹${perGram.toFixed(3)} / g`;
    }
    if (stdUnit === 'L') {
      const perMl = rate / 1000;
      return `₹${perMl.toFixed(3)} / ml`;
    }
    if (stdUnit === 'pcs') {
      return `₹${rate.toFixed(2)} / pc`;
    }
    if (stdUnit === 'g') {
      return `₹${rate.toFixed(2)} / g`;
    }
    if (stdUnit === 'ml') {
      return `₹${rate.toFixed(2)} / ml`;
    }
    return `₹${rate.toFixed(2)} / ${stdUnit}`;
  }

  getCategoryBadgeClass(category) {
    const c = (category || '').toLowerCase();
    if (c.includes('meat') || c.includes('poultry')) return 'main';
    if (c.includes('dairy') || c.includes('cheese')) return 'side';
    if (c.includes('bakery') || c.includes('bread')) return 'combo';
    if (c.includes('sauce') || c.includes('condiment')) return 'drink';
    return 'main';
  }

  updateMasterMaterialKPIs() {
    const materials = this.masterRawMaterials || [];
    if (this.masterTotalMaterials) this.masterTotalMaterials.textContent = materials.length;
    if (this.masterMatCountBadge) this.masterMatCountBadge.textContent = materials.length;

    // Update Category counts
    const countAll = materials.length;
    const countMeats = materials.filter(m => (m.category || '').toLowerCase().includes('meat') || (m.category || '').toLowerCase().includes('poultry')).length;
    const countDairy = materials.filter(m => (m.category || '').toLowerCase().includes('dairy') || (m.category || '').toLowerCase().includes('cheese')).length;
    const countBakery = materials.filter(m => (m.category || '').toLowerCase().includes('bakery') || (m.category || '').toLowerCase().includes('bread')).length;
    const countSauces = materials.filter(m => (m.category || '').toLowerCase().includes('sauce') || (m.category || '').toLowerCase().includes('condiment')).length;
    const countProduce = materials.filter(m => (m.category || '').toLowerCase().includes('produce') || (m.category || '').toLowerCase().includes('veggie')).length;
    const countOils = materials.filter(m => (m.category || '').toLowerCase().includes('oil') || (m.category || '').toLowerCase().includes('beverage')).length;
    const countPkg = materials.filter(m => (m.category || '').toLowerCase().includes('pkg') || (m.category || '').toLowerCase().includes('pack')).length;

    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('mat-cat-count-all', countAll);
    setTxt('mat-cat-count-meats', countMeats);
    setTxt('mat-cat-count-dairy', countDairy);
    setTxt('mat-cat-count-bakery', countBakery);
    setTxt('mat-cat-count-sauces', countSauces);
    setTxt('mat-cat-count-produce', countProduce);
    setTxt('mat-cat-count-oils', countOils);
    setTxt('mat-cat-count-pkg', countPkg);
  }

  updateMasterMaterialRate(matId, newRate) {
    const mat = (this.masterRawMaterials || []).find(m => m.id === matId);
    if (!mat) return;
    mat.costPerUnit = newRate;

    // Update base rate badge in row
    const badge = document.querySelector(`.mat-base-preview-${matId}`);
    if (badge) {
      const effectiveRate = newRate * (1 + (this.inflationSurgePct || 0) / 100);
      badge.textContent = this.getBaseUnitRateDisplay(effectiveRate, mat.standardUnit || 'kg');
    }

    // Reactively update Section 2's ingredient rows and food cost calculation!
    this.renderRawMaterialRows();
    this.recalculateRawMaterialsFoodCost();

    // Debounced persist to API
    if (this._saveMasterTimeout) clearTimeout(this._saveMasterTimeout);
    this._saveMasterTimeout = setTimeout(() => {
      fetch('/api/raw-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ material: mat })
      }).catch(() => {});
    }, 400);
  }

  updateMasterMaterialUom(matId, newUom) {
    const mat = (this.masterRawMaterials || []).find(m => m.id === matId);
    if (!mat) return;
    mat.standardUnit = newUom;

    const badge = document.querySelector(`.mat-base-preview-${matId}`);
    if (badge) {
      const effectiveRate = (mat.costPerUnit || 0) * (1 + (this.inflationSurgePct || 0) / 100);
      badge.textContent = this.getBaseUnitRateDisplay(effectiveRate, newUom);
    }

    this.renderRawMaterialRows();
    this.recalculateRawMaterialsFoodCost();

    fetch('/api/raw-materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ material: mat })
    }).catch(() => {});
  }

  handleInflationSlider(pct) {
    this.inflationSurgePct = pct;
    if (this.masterInflationVal) {
      this.masterInflationVal.textContent = pct > 0 ? `+${pct}% (Inflation)` : `+0% (Baseline)`;
      this.masterInflationVal.style.color = pct > 0 ? '#EF4444' : '#F59E0B';
    }

    if (this.masterInflationImpact) {
      if (pct > 0) {
        this.masterInflationImpact.textContent = `All master rates surged by +${pct}%. Recipe margins re-evaluated.`;
      } else {
        this.masterInflationImpact.textContent = `Baseline supplier purchasing costs without inflation.`;
      }
    }

    // Re-render Section 1 previews and Section 2 calculations
    this.renderMasterRawMaterialsTable();
    this.renderRawMaterialRows();
    this.recalculateRawMaterialsFoodCost();
  }

  populateQuickAddDropdown() {
    if (!this.quickAddMatSelect) return;
    const materials = this.masterRawMaterials || [];
    let html = '<option value="">-- Choose Raw Material from Master List --</option>';

    // Group by category
    const cats = {};
    materials.forEach(m => {
      const c = m.category || 'General';
      if (!cats[c]) cats[c] = [];
      cats[c].push(m);
    });

    Object.keys(cats).sort().forEach(catName => {
      html += `<optgroup label="${catName}">`;
      cats[catName].forEach(m => {
        html += `<option value="${m.name}">${m.name} (₹${m.costPerUnit}/${m.standardUnit})</option>`;
      });
      html += `</optgroup>`;
    });

    this.quickAddMatSelect.innerHTML = html;
  }

  handleQuickAddIngredient() {
    if (!this.quickAddMatSelect || !this.quickAddMatSelect.value) {
      alert('Please select a raw material from the master list dropdown.');
      return;
    }

    const matName = this.quickAddMatSelect.value;
    const qty = parseFloat(this.quickAddQty ? this.quickAddQty.value : 50) || 50;
    const uom = (this.quickAddUom ? this.quickAddUom.value : 'g') || 'g';

    const masterRateInfo = this.getMasterRateForIngredient(matName);

    const newIng = {
      name: matName,
      recipeQty: qty,
      recipeUom: uom,
      packQty: masterRateInfo.mat ? masterRateInfo.mat.packQty || 1000 : 1000,
      packUom: masterRateInfo.mat ? masterRateInfo.mat.standardUnit || 'g' : 'g',
      packPrice: masterRateInfo.mat ? masterRateInfo.mat.costPerUnit || 100 : 100,
      calculatedCost: this.calculatePortionCostFromMaster(matName, qty, uom)
    };

    if (!this.rawMaterials) this.rawMaterials = [];
    this.rawMaterials.push(newIng);

    this.renderRawMaterialRows();
    this.recalculateRawMaterialsFoodCost();
    this.showFloatingToast(`Added ${matName} to recipe! ✓`, '#10B981', 1800);
  }

  openAddMaterialModal(mat = null) {
    if (!this.adminMaterialSubmodal) return;
    if (this.matModalTitle) this.matModalTitle.textContent = mat ? '✏️ EDIT MASTER RAW MATERIAL' : '+ ADD MASTER RAW MATERIAL';
    if (this.matModalId) this.matModalId.value = mat ? mat.id : '';
    if (this.matModalName) this.matModalName.value = mat ? mat.name : '';
    if (this.matModalCategory) this.matModalCategory.value = mat ? mat.category : 'Poultry & Meats';
    if (this.matModalUnit) this.matModalUnit.value = mat ? mat.standardUnit : 'kg';
    if (this.matModalRate) this.matModalRate.value = mat ? mat.costPerUnit : 180;
    if (this.matModalNotes) this.matModalNotes.value = mat ? mat.notes || '' : '';
    this.updateMatModalBasePreview();
    this.adminMaterialSubmodal.classList.remove('hidden');
    if (this.matModalName) this.matModalName.focus();
  }

  closeAddMaterialModal() {
    if (this.adminMaterialSubmodal) this.adminMaterialSubmodal.classList.add('hidden');
  }

  updateMatModalBasePreview() {
    if (!this.matModalBasePreview) return;
    const rate = parseFloat(this.matModalRate ? this.matModalRate.value : 0) || 0;
    const uom = this.matModalUnit ? this.matModalUnit.value : 'kg';
    this.matModalBasePreview.textContent = this.getBaseUnitRateDisplay(rate, uom);
  }

  handleSaveMaterial() {
    const name = this.matModalName ? this.matModalName.value.trim() : '';
    if (!name) {
      alert('Please enter a raw material name.');
      return;
    }

    const rate = parseFloat(this.matModalRate ? this.matModalRate.value : 0) || 0;
    const unit = this.matModalUnit ? this.matModalUnit.value : 'kg';
    const category = this.matModalCategory ? this.matModalCategory.value : 'General';
    const notes = this.matModalNotes ? this.matModalNotes.value.trim() : '';
    const id = (this.matModalId && this.matModalId.value) ? this.matModalId.value : ('mat-' + Date.now().toString().slice(-6));

    const matData = {
      id: id,
      name: name,
      category: category,
      standardUnit: unit,
      costPerUnit: rate,
      notes: notes,
      usedInRecipes: []
    };

    const existingIdx = (this.masterRawMaterials || []).findIndex(m => m.id === id || m.name.toLowerCase() === name.toLowerCase());
    if (existingIdx >= 0) {
      matData.usedInRecipes = this.masterRawMaterials[existingIdx].usedInRecipes || [];
      this.masterRawMaterials[existingIdx] = matData;
    } else {
      if (!this.masterRawMaterials) this.masterRawMaterials = [];
      this.masterRawMaterials.unshift(matData);
    }

    fetch('/api/raw-materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ material: matData })
    }).catch(() => {});

    this.closeAddMaterialModal();
    this.renderMasterRawMaterialsTable();
    this.updateMasterMaterialKPIs();
    this.populateQuickAddDropdown();
    this.renderRawMaterialRows();
    this.recalculateRawMaterialsFoodCost();
    this.showFloatingToast(`Raw material "${name}" saved! ✓`, '#10B981', 2200);
  }

  deleteMasterMaterial(matId) {
    const mat = (this.masterRawMaterials || []).find(m => m.id === matId);
    const name = mat ? mat.name : 'material';
    if (!confirm(`Are you sure you want to delete "${name}" from master raw materials?`)) return;

    this.masterRawMaterials = (this.masterRawMaterials || []).filter(m => m.id !== matId);
    fetch('/api/raw-materials', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: matId })
    }).catch(() => {});

    this.renderMasterRawMaterialsTable();
    this.updateMasterMaterialKPIs();
    this.populateQuickAddDropdown();
    this.renderRawMaterialRows();
    this.recalculateRawMaterialsFoodCost();
    this.showFloatingToast(`Deleted "${name}"`, '#EF4444', 1800);
  }

  exportMasterMaterialsCSV() {
    const materials = this.masterRawMaterials || [];
    if (materials.length === 0) {
      alert('No master raw materials to export.');
      return;
    }

    let csv = 'ID,Name,Category,Standard_UoM,Purchase_Rate_INR,Effective_Base_Rate,Notes,Recipes_Count\n';
    materials.forEach(m => {
      const baseInfo = this.getBaseUnitRateDisplay(m.costPerUnit || 0, m.standardUnit || 'kg');
      const row = [
        `"${m.id || ''}"`,
        `"${(m.name || '').replace(/"/g, '""')}"`,
        `"${(m.category || '').replace(/"/g, '""')}"`,
        `"${m.standardUnit || 'kg'}"`,
        (m.costPerUnit || 0).toFixed(2),
        `"${baseInfo}"`,
        `"${(m.notes || '').replace(/"/g, '""')}"`,
        (m.usedInRecipes ? m.usedInRecipes.length : 0)
      ];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wof_master_raw_materials_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.showFloatingToast('Master Raw Materials CSV downloaded! 📥', '#10B981', 2000);
  }

  // --- SECTION 2: RECIPE FORMULATION & FOOD COST PULLER ---
  populateRecipeSelect() {
    if (!this.calcRecipeSelect) return;
    const recipes = this.recipesCache || [];
    if (recipes.length === 0) return;

    const hotKitchen = recipes.filter(r => (r.station || '').toLowerCase().includes('hot') || (r.category || '').match(/fries|wrap|burger|sandwich|pasta|soup/i));
    const coldStation = recipes.filter(r => (r.station || '').toLowerCase().includes('cold') || (r.category || '').match(/shake|mojito|falooda|dessert|brownie/i));

    let html = '';
    if (hotKitchen.length > 0) {
      html += `<optgroup label="🔥 HOT KITCHEN (FRIES, WRAPS, BURGERS)">`;
      hotKitchen.forEach(r => {
        html += `<option value="${r.id}">${r.name} — ${r.portion || r.category}</option>`;
      });
      html += `</optgroup>`;
    }

    if (coldStation.length > 0) {
      html += `<optgroup label="❄️ COLD STATION (SHAKES, MOJITOS, FALOODA)">`;
      coldStation.forEach(r => {
        html += `<option value="${r.id}">${r.name} — ${r.portion || r.category}</option>`;
      });
      html += `</optgroup>`;
    }

    this.calcRecipeSelect.innerHTML = html;
  }

  renderRecipeQuickChips() {
    if (!this.recipeQuickChips) return;
    const recipes = this.recipesCache || [];
    if (recipes.length === 0) return;

    const top8 = recipes.slice(0, 8);
    let html = '';
    top8.forEach((r, idx) => {
      const activeClass = idx === 0 ? 'active' : '';
      const icon = (r.category || '').toLowerCase().includes('drink') || (r.category || '').toLowerCase().includes('shake') ? '🥤' :
        ((r.category || '').toLowerCase().includes('fries') ? '🍟' : '🍔');
      html += `
        <div class="recipe-chip ${activeClass}" data-recipe-id="${r.id}">
          <span>${icon}</span> ${r.name}
        </div>
      `;
    });

    this.recipeQuickChips.innerHTML = html;
    this.recipeQuickChips.querySelectorAll('.recipe-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        this.recipeQuickChips.querySelectorAll('.recipe-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const id = chip.getAttribute('data-recipe-id');
        if (this.calcRecipeSelect) this.calcRecipeSelect.value = id;
        this.pullRecipeIntoCalculator(id);
      });
    });
  }

  getMasterRateForIngredient(matName) {
    const term = (matName || '').toLowerCase().trim();
    const materials = this.masterRawMaterials || [];

    // Exact or best match
    let found = materials.find(m => m.name.toLowerCase() === term);
    if (!found) {
      // Partial matching (e.g. "French Fries" in "French Fries (Frozen)")
      found = materials.find(m => term.includes(m.name.toLowerCase()) || m.name.toLowerCase().includes(term));
    }

    const inflationMultiplier = 1 + (this.inflationSurgePct || 0) / 100;

    if (found) {
      const stdRate = (found.costPerUnit || 0) * inflationMultiplier;
      const unit = found.standardUnit || 'kg';
      let baseRate = 0;
      let baseUnit = 'g';

      if (unit === 'kg') {
        baseRate = stdRate / 1000;
        baseUnit = 'g';
      } else if (unit === 'L') {
        baseRate = stdRate / 1000;
        baseUnit = 'ml';
      } else if (unit === 'pcs') {
        baseRate = stdRate;
        baseUnit = 'pcs';
      } else if (unit === 'g') {
        baseRate = stdRate;
        baseUnit = 'g';
      } else if (unit === 'ml') {
        baseRate = stdRate;
        baseUnit = 'ml';
      }

      return {
        found: true,
        mat: found,
        ratePerStdUnit: stdRate,
        standardUnit: unit,
        baseRate: baseRate,
        baseUnit: baseUnit,
        rateLabel: `₹${stdRate.toFixed(2)}/${unit} (${this.getBaseUnitRateDisplay(stdRate, unit)})`
      };
    }

    // Default rate if not in master list
    return {
      found: false,
      mat: null,
      ratePerStdUnit: 120,
      standardUnit: 'kg',
      baseRate: 0.12,
      baseUnit: 'g',
      rateLabel: '₹120/kg (Default Rate)'
    };
  }

  calculatePortionCostFromMaster(matName, qty, uom) {
    const rateInfo = this.getMasterRateForIngredient(matName);
    const norm = this.convertToBaseUnit(parseFloat(qty) || 0, uom);

    if (rateInfo.baseUnit === 'pcs' || norm.base === 'pcs') {
      return (parseFloat(qty) || 0) * rateInfo.baseRate;
    }

    return norm.val * rateInfo.baseRate;
  }

  pullRecipeIntoCalculator(recipeId) {
    const recipes = this.recipesCache || [];
    const recipe = recipes.find(r => r.id === recipeId) || recipes[0];
    if (!recipe) return;

    if (this.calcItemName) this.calcItemName.value = recipe.name || '';

    let cat = 'main';
    const catLower = (recipe.category || '').toLowerCase();
    if (catLower.includes('fries') || catLower.includes('appetizer')) cat = 'side';
    else if (catLower.includes('shake') || catLower.includes('mojito') || catLower.includes('drink')) cat = 'drink';
    else if (catLower.includes('combo')) cat = 'combo';
    if (this.calcItemCategory) this.calcItemCategory.value = cat;

    if (this.calcItemPortion) this.calcItemPortion.value = recipe.portion || 'Standard Portion';
    if (this.calcActiveItemTag) {
      this.calcActiveItemTag.className = `category-tag ${cat}`;
      this.calcActiveItemTag.textContent = (recipe.station || cat).toUpperCase();
    }

    if (this.calcSellingPriceInput) {
      this.calcSellingPriceInput.value = recipe.suggestedPrice || 89;
    }

    // Clone raw materials and link to Section 1's Master Rates!
    this.rawMaterials = (recipe.rawMaterials || []).map(mat => {
      const portionCost = this.calculatePortionCostFromMaster(mat.name, mat.recipeQty, mat.recipeUom);
      return {
        name: mat.name,
        recipeQty: mat.recipeQty !== undefined ? mat.recipeQty : 100,
        recipeUom: mat.recipeUom || 'g',
        packQty: mat.packQty !== undefined ? mat.packQty : 1000,
        packUom: mat.packUom || 'g',
        packPrice: mat.packPrice !== undefined ? mat.packPrice : 120,
        calculatedCost: portionCost
      };
    });

    this.renderRawMaterialRows();
    this.recalculateRawMaterialsFoodCost();
  }

  renderRawMaterialRows() {
    if (!this.calcRawMaterialsTbody) return;

    if (!this.rawMaterials || this.rawMaterials.length === 0) {
      this.calcRawMaterialsTbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:18px; color:#94A3B8;">
            No raw materials added yet. Click "+ ADD INGREDIENT" or select a recipe above!
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    this.rawMaterials.forEach((mat, i) => {
      const cost = this.calculatePortionCostFromMaster(mat.name, mat.recipeQty, mat.recipeUom);
      mat.calculatedCost = cost;
      const masterInfo = this.getMasterRateForIngredient(mat.name);

      html += `
        <tr data-index="${i}">
          <td>
            <div style="font-weight:800; color:#F8FAFC; display:flex; align-items:center; gap:6px;">
              <span>${mat.name}</span>
              ${masterInfo.found ? `<span style="font-size:9px; color:#10B981; background:rgba(16,185,129,0.15); border-radius:4px; padding:1px 4px;">PULLED ✓</span>` : `<span style="font-size:9px; color:#F59E0B; background:rgba(245,158,11,0.15); border-radius:4px; padding:1px 4px;">ESTIMATE</span>`}
            </div>
          </td>
          <td>
            <input type="number" class="calc-mat-recipe-qty" value="${mat.recipeQty}" step="0.5" min="0" style="width:100%;">
          </td>
          <td>
            <select class="calc-mat-recipe-uom calc-select" style="padding:4px 6px; font-size:11px; width:100%;">
              <option value="g" ${mat.recipeUom === 'g' ? 'selected' : ''}>g</option>
              <option value="ml" ${mat.recipeUom === 'ml' ? 'selected' : ''}>ml</option>
              <option value="pcs" ${mat.recipeUom === 'pcs' ? 'selected' : ''}>pcs</option>
              <option value="tbsp" ${mat.recipeUom === 'tbsp' ? 'selected' : ''}>tbsp</option>
              <option value="tsp" ${mat.recipeUom === 'tsp' ? 'selected' : ''}>tsp</option>
            </select>
          </td>
          <td>
            <span style="font-size:11px; color:#38BDF8; font-weight:700;">
              ${masterInfo.rateLabel}
            </span>
          </td>
          <td style="font-weight:900; color:#FDE047; text-align:right; font-size:13px; font-variant-numeric:tabular-nums;">
            ₹${cost.toFixed(2)}
          </td>
          <td style="text-align:center;">
            <button class="remove-ing-btn" onclick="window.uiManager.removeRawMaterialRow(${i})" title="Remove ingredient">✕</button>
          </td>
        </tr>
      `;
    });

    this.calcRawMaterialsTbody.innerHTML = html;

    // Attach row listeners
    this.calcRawMaterialsTbody.querySelectorAll('tr').forEach(tr => {
      const idx = parseInt(tr.getAttribute('data-index'), 10);
      const inputRecipeQty = tr.querySelector('.calc-mat-recipe-qty');
      const selectRecipeUom = tr.querySelector('.calc-mat-recipe-uom');

      const onRowChange = () => {
        if (!this.rawMaterials[idx]) return;
        this.rawMaterials[idx].recipeQty = parseFloat(inputRecipeQty.value) || 0;
        this.rawMaterials[idx].recipeUom = selectRecipeUom.value;

        const updatedCost = this.calculatePortionCostFromMaster(
          this.rawMaterials[idx].name,
          this.rawMaterials[idx].recipeQty,
          this.rawMaterials[idx].recipeUom
        );
        this.rawMaterials[idx].calculatedCost = updatedCost;

        tr.cells[4].textContent = `₹${updatedCost.toFixed(2)}`;
        this.recalculateRawMaterialsFoodCost();
      };

      inputRecipeQty.addEventListener('input', onRowChange);
      selectRecipeUom.addEventListener('change', onRowChange);
    });
  }

  addRawMaterialRow(data = null) {
    const newMat = data || {
      name: 'Burger Bun (Sesame)',
      recipeQty: 1,
      recipeUom: 'pcs',
      packQty: 1,
      packUom: 'pcs',
      packPrice: 10,
      calculatedCost: 10.00
    };
    if (!this.rawMaterials) this.rawMaterials = [];
    this.rawMaterials.push(newMat);
    this.renderRawMaterialRows();
    this.recalculateRawMaterialsFoodCost();
  }

  removeRawMaterialRow(index) {
    if (this.rawMaterials && this.rawMaterials[index]) {
      this.rawMaterials.splice(index, 1);
      this.renderRawMaterialRows();
      this.recalculateRawMaterialsFoodCost();
    }
  }

  convertToBaseUnit(qty, uom) {
    uom = (uom || '').toLowerCase().trim();
    if (uom === 'kg') return { val: qty * 1000, base: 'g' };
    if (uom === 'g' || uom === 'gm' || uom === 'grams') return { val: qty, base: 'g' };
    if (uom === 'l' || uom === 'ltr' || uom === 'liter' || uom === 'liters') return { val: qty * 1000, base: 'ml' };
    if (uom === 'ml' || uom === 'milliliter') return { val: qty, base: 'ml' };
    if (uom === 'tbsp') return { val: qty * 15, base: 'g' };
    if (uom === 'tsp') return { val: qty * 5, base: 'g' };
    return { val: qty, base: 'pcs' };
  }

  calculateRawMaterialCost(recipeQty, recipeUom, packSize, packUom, packPrice) {
    const normRecipe = this.convertToBaseUnit(parseFloat(recipeQty) || 0, recipeUom);
    const normPack = this.convertToBaseUnit(parseFloat(packSize) || 1, packUom);
    const price = parseFloat(packPrice) || 0;

    if (normPack.val <= 0) return 0;

    if (normRecipe.base === normPack.base || (normRecipe.base !== 'pcs' && normPack.base !== 'pcs')) {
      return (price / normPack.val) * normRecipe.val;
    }
    return (price / (parseFloat(packSize) || 1)) * (parseFloat(recipeQty) || 0);
  }

  recalculateRawMaterialsFoodCost() {
    const rawCost = (this.rawMaterials || []).reduce((sum, mat) => {
      const c = this.calculatePortionCostFromMaster(mat.name, mat.recipeQty, mat.recipeUom);
      return sum + c;
    }, 0);

    const packagingCost = parseFloat(this.calcPackagingCost ? this.calcPackagingCost.value : 5) || 0;
    const wastagePct = parseFloat(this.calcWastagePct ? this.calcWastagePct.value : 4) || 0;
    const wastageCost = (rawCost * wastagePct) / 100;
    const totalFoodCost = rawCost + packagingCost + wastageCost;

    const sellingPrice = parseFloat(this.calcSellingPriceInput ? this.calcSellingPriceInput.value : 89) || 0;
    const foodCostPct = sellingPrice > 0 ? (totalFoodCost / sellingPrice) * 100 : 0;
    const grossProfit = sellingPrice - totalFoodCost;
    const grossMarginPct = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;
    const markup = totalFoodCost > 0 ? (sellingPrice / totalFoodCost) : 0;

    // Display Hero values
    if (this.calcTotalFoodCostHero) this.calcTotalFoodCostHero.textContent = `₹${totalFoodCost.toFixed(2)}`;
    if (this.calcRawMaterialsCost) this.calcRawMaterialsCost.textContent = `₹${rawCost.toFixed(2)}`;
    if (this.calcPackagingCostDisplay) this.calcPackagingCostDisplay.textContent = `₹${packagingCost.toFixed(2)}`;
    if (this.calcWastageCostDisplay) this.calcWastageCostDisplay.textContent = `₹${wastageCost.toFixed(2)} (${wastagePct}%)`;

    // Food Cost % & Gauge
    if (this.calcFoodCostPctDisplay) {
      let statusText = 'Optimal ✓';
      let statusColor = '#10B981';
      if (foodCostPct > 35) {
        statusText = 'High Alert ⚠️';
        statusColor = '#EF4444';
      } else if (foodCostPct >= 30) {
        statusText = 'Moderate';
        statusColor = '#F59E0B';
      }
      this.calcFoodCostPctDisplay.textContent = `${foodCostPct.toFixed(1)}% (${statusText})`;
      this.calcFoodCostPctDisplay.style.color = statusColor;
    }

    if (this.calcGaugeFill) {
      const clampWidth = Math.min(100, Math.max(0, foodCostPct));
      this.calcGaugeFill.style.width = `${clampWidth}%`;
      this.calcGaugeFill.style.backgroundColor = foodCostPct < 30 ? '#10B981' : (foodCostPct <= 35 ? '#F59E0B' : '#EF4444');
    }

    // Profit & Margins
    if (this.calcGrossProfitDisplay) this.calcGrossProfitDisplay.textContent = `₹${grossProfit.toFixed(2)}`;
    if (this.calcGrossMarginDisplay) {
      this.calcGrossMarginDisplay.textContent = `${grossMarginPct.toFixed(1)}%`;
      this.calcGrossMarginDisplay.style.color = grossMarginPct >= 70 ? '#10B981' : (grossMarginPct >= 60 ? '#F59E0B' : '#EF4444');
    }
    if (this.calcMarkupDisplay) this.calcMarkupDisplay.textContent = `${markup.toFixed(2)}x`;

    // Target Food Cost Price Suggester
    const targetFcPct = parseFloat(this.calcTargetFcInput ? this.calcTargetFcInput.value : 28) || 28;
    if (this.calcTargetFcLbl) this.calcTargetFcLbl.textContent = targetFcPct;

    let suggested = targetFcPct > 0 ? (totalFoodCost / (targetFcPct / 100)) : 0;
    const applyCharm = this.calcCharmPricingCb && this.calcCharmPricingCb.checked;
    if (applyCharm && suggested > 0) {
      suggested = Math.max(9, Math.ceil((suggested - 9) / 10) * 10 + 9);
    } else {
      suggested = Math.round(suggested);
    }

    if (this.calcSuggestedPriceDisplay) this.calcSuggestedPriceDisplay.textContent = `₹${suggested}`;
  }

  applySuggestedPrice() {
    if (!this.calcSuggestedPriceDisplay || !this.calcSellingPriceInput) return;
    const num = parseFloat(this.calcSuggestedPriceDisplay.textContent.replace(/[^\d.]/g, '')) || 0;
    if (num > 0) {
      this.calcSellingPriceInput.value = num;
      this.recalculateRawMaterialsFoodCost();
      this.showFloatingToast(`Applied suggested price: ₹${num}! ✓`, '#38BDF8', 1800);
    }
  }

  saveRecipeAsMenuItem() {
    const name = this.calcItemName ? this.calcItemName.value.trim() : 'Recipe Item';
    const category = this.calcItemCategory ? this.calcItemCategory.value : 'main';
    const portion = this.calcItemPortion ? this.calcItemPortion.value.trim() : '1 portion';
    const packagingCost = parseFloat(this.calcPackagingCost.value) || 0;
    const wastagePct = parseFloat(this.calcWastagePct.value) || 0;
    const rawCost = (this.rawMaterials || []).reduce((sum, mat) => {
      return sum + this.calculatePortionCostFromMaster(mat.name, mat.recipeQty, mat.recipeUom);
    }, 0);
    const wastageCost = (rawCost * wastagePct) / 100;
    const totalCost = rawCost + packagingCost + wastageCost;
    const sellingPrice = parseFloat(this.calcSellingPriceInput.value) || 89;
    const targetFoodCostPct = parseFloat(this.calcTargetFcInput.value) || 28;

    const targetId = 'item-' + Date.now().toString().slice(-6);

    const itemObj = {
      id: targetId,
      name: name,
      category: category,
      icon: category === 'drink' ? '🥤' : (category === 'side' ? '🍟' : (category === 'combo' ? '🎁' : '🍔')),
      price: sellingPrice,
      cost: Number(totalCost.toFixed(2)),
      foodCost: Number(rawCost.toFixed(2)),
      packagingCost: Number(packagingCost.toFixed(2)),
      portion: portion,
      popularity: 850,
      targetFoodCostPct: targetFoodCostPct,
      ingredients: (this.rawMaterials || []).map(mat => {
        const masterInfo = this.getMasterRateForIngredient(mat.name);
        return {
          name: mat.name,
          packCost: masterInfo.ratePerStdUnit,
          packQty: 1,
          packUnit: masterInfo.standardUnit,
          portionQty: mat.recipeQty,
          recipeUom: mat.recipeUom,
          calculatedCost: mat.calculatedCost
        };
      })
    };

    if (!this.menuItemsCache) this.menuItemsCache = this.getLocalItems();
    // If item with same name exists, update it; otherwise append
    const existingIdx = this.menuItemsCache.findIndex(it => it.name.toLowerCase() === name.toLowerCase());
    if (existingIdx >= 0) {
      itemObj.id = this.menuItemsCache[existingIdx].id;
      this.menuItemsCache[existingIdx] = itemObj;
    } else {
      this.menuItemsCache.push(itemObj);
    }

    this.saveItemsLocally(this.menuItemsCache);

    fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemObj)
    }).catch(() => {});

    this.updatePresetSelector();
    this.renderItemsView();
    this.renderMenuEngineeringMatrix();
    if (this.navCountItems) this.navCountItems.textContent = this.menuItemsCache.length;
    this.showFloatingToast(`Recipe for "${name}" synced to Menu Tracker! ✓`, '#10B981', 2500);
  }

  recalculateAllMenuItemsFromMaster() {
    const items = this.menuItemsCache || [];
    if (items.length === 0) {
      alert('No menu items in catalog to recalculate.');
      return;
    }

    let updatedCount = 0;
    items.forEach(it => {
      if (Array.isArray(it.ingredients) && it.ingredients.length > 0) {
        let newFoodCost = 0;
        it.ingredients.forEach(ing => {
          const cost = this.calculatePortionCostFromMaster(ing.name, ing.portionQty || 50, ing.recipeUom || 'g');
          ing.calculatedCost = cost;
          newFoodCost += cost;
        });
        it.foodCost = Number(newFoodCost.toFixed(2));
        it.cost = Number((it.foodCost + (it.packagingCost || 5)).toFixed(2));
        updatedCount++;
      }
    });

    this.saveItemsLocally(items);

    // Sync to API
    items.forEach(it => {
      fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(it)
      }).catch(() => {});
    });

    this.renderItemsView();
    this.renderMenuEngineeringMatrix();
    this.showFloatingToast(`⚡ Recalculated ${updatedCount} menu items from Master Raw Material rates!`, '#10B981', 2500);
  }

  copyRecipeBreakdown() {
    const name = this.calcItemName ? this.calcItemName.value : 'Recipe';
    const totalCost = this.calcTotalFoodCostHero ? this.calcTotalFoodCostHero.textContent : '₹0';
    const price = this.calcSellingPriceInput ? this.calcSellingPriceInput.value : '0';
    const fcPct = this.calcFoodCostPctDisplay ? this.calcFoodCostPctDisplay.textContent : '0%';
    const profit = this.calcGrossProfitDisplay ? this.calcGrossProfitDisplay.textContent : '0';

    let text = `=== WOF RECIPE COST SHEET: ${name.toUpperCase()} ===\n`;
    text += `Selling Price: ₹${price}\n`;
    text += `Recipe Item Food Cost (CoGS): ${totalCost}\n`;
    text += `Food Cost %: ${fcPct}\n`;
    text += `Gross Profit: ${profit}\n\n`;
    text += `Raw Materials Formulation (Pulled from Master):\n`;
    (this.rawMaterials || []).forEach((mat, i) => {
      const masterInfo = this.getMasterRateForIngredient(mat.name);
      text += `${i + 1}. ${mat.name} — ${mat.recipeQty}${mat.recipeUom} (Rate: ${masterInfo.rateLabel}) = ₹${(mat.calculatedCost || 0).toFixed(2)}\n`;
    });
    text += `Packaging Cost: ₹${this.calcPackagingCost ? this.calcPackagingCost.value : '0'}\n`;
    text += `Kitchen Wastage: ${this.calcWastagePct ? this.calcWastagePct.value : '0'}%\n`;

    navigator.clipboard.writeText(text).then(() => {
      if (this.calcCopySummaryBtn) {
        this.calcCopySummaryBtn.textContent = 'COPIED! ✓';
        setTimeout(() => { this.calcCopySummaryBtn.textContent = '📋 COPY RECIPE SHEET'; }, 2000);
      }
    });
  }

  openRecipePasteModal() {
    if (this.adminRecipePasteModal) this.adminRecipePasteModal.classList.remove('hidden');
    if (this.recipePasteTextarea) this.recipePasteTextarea.focus();
  }

  closeRecipePasteModal() {
    if (this.adminRecipePasteModal) this.adminRecipePasteModal.classList.add('hidden');
  }

  handleApplyRecipePaste() {
    const text = this.recipePasteTextarea ? this.recipePasteTextarea.value.trim() : '';
    if (!text) {
      alert('Please paste recipe or ingredient specifications into the text area.');
      return;
    }

    const lines = text.split(/[\n+;]+/).map(l => l.trim()).filter(Boolean);
    const extracted = [];

    lines.forEach(line => {
      let name = line;
      let qty = 50;
      let uom = 'g';

      const parenMatch = line.match(/^(.+?)\s*\(\s*(\d+(?:\.\d+)?)\s*(g|kg|ml|l|pcs|tbsp|tsp)?\s*\)/i);
      if (parenMatch) {
        name = parenMatch[1].trim();
        qty = parseFloat(parenMatch[2]) || 50;
        if (parenMatch[3]) uom = parenMatch[3].toLowerCase();
      } else {
        const leadingMatch = line.match(/^(\d+(?:\.\d+)?)\s*(g|kg|ml|l|pcs|tbsp|tsp)?\s+(.+)$/i);
        if (leadingMatch) {
          qty = parseFloat(leadingMatch[1]) || 50;
          if (leadingMatch[2]) uom = leadingMatch[2].toLowerCase();
          name = leadingMatch[3].trim();
        } else {
          const colonMatch = line.match(/^(.+?)\s*:\s*(\d+(?:\.\d+)?)\s*(g|kg|ml|l|pcs|tbsp|tsp)?/i);
          if (colonMatch) {
            name = colonMatch[1].trim();
            qty = parseFloat(colonMatch[2]) || 50;
            if (colonMatch[3]) uom = colonMatch[3].toLowerCase();
          }
        }
      }

      name = name.replace(/^[-*•\d.]+\s*/, '').trim();
      if (!name) name = 'Ingredient';

      const cost = this.calculatePortionCostFromMaster(name, qty, uom);
      extracted.push({
        name,
        recipeQty: qty,
        recipeUom: uom,
        calculatedCost: cost
      });
    });

    if (extracted.length > 0) {
      this.rawMaterials = extracted;
      this.renderRawMaterialRows();
      this.recalculateRawMaterialsFoodCost();
      this.closeRecipePasteModal();
      this.showFloatingToast(`Extracted ${extracted.length} raw materials & pulled master rates! ⚡`, '#10B981', 2500);
    } else {
      alert('Could not parse ingredients from the pasted text. Please check format.');
    }
  }

  getDefaultRecipesList() {
    return [
      {
        id: "rec-ff-01",
        name: "Classic French Fries",
        station: "Hot Kitchen",
        category: "Fries & Loaded Fries",
        portion: "150g portion (Standard)",
        suggestedPrice: 89,
        rawMaterials: [
          { name: "French Fries (Frozen)", recipeQty: 150, recipeUom: "g", packQty: 1000, packUom: "g", packPrice: 120 },
          { name: "Table Salt", recipeQty: 1, recipeUom: "g", packQty: 1000, packUom: "g", packPrice: 25 },
          { name: "Table Ketchup Dip", recipeQty: 30, recipeUom: "g", packQty: 1000, packUom: "g", packPrice: 110 },
          { name: "Frying Oil Absorption", recipeQty: 15, recipeUom: "ml", packQty: 1000, packUom: "ml", packPrice: 140 }
        ]
      }
    ];
  }

  // --- MILESTONE OFFERS MANAGER (CRUD) ---
  initOffers() {
    this.activeOffersFilter = 'all';
    fetch('/api/offers')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.offers) && data.offers.length > 0) {
          this.offersCache = data.offers;
          this.saveOffersLocally(this.offersCache);
        } else {
          this.offersCache = this.getLocalOffers();
        }
        this.renderOffersView();
      })
      .catch(() => {
        this.offersCache = this.getLocalOffers();
        this.renderOffersView();
      });
  }

  getLocalOffers() {
    try {
      const data = localStorage.getItem('wof_rush_admin_offers');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    const defaults = this.getDefaultOffersList();
    this.saveOffersLocally(defaults);
    return defaults;
  }

  saveOffersLocally(offers) {
    try {
      localStorage.setItem('wof_rush_admin_offers', JSON.stringify(offers));
    } catch (e) {}
  }

  getDefaultOffersList() {
    return [
      {
        id: "off-1001",
        title: "WOF CRISPY REWARD",
        conditionType: "distance",
        threshold: 1000,
        reward: "FREE FRIES with any burger meal",
        codePrefix: "WOF-FREEFRIES",
        minOrder: 0,
        active: true,
        description: "Awarded to players who cross 1,000 meters in a single run."
      },
      {
        id: "off-1002",
        title: "WOF CRAVE VOUCHER",
        conditionType: "distance",
        threshold: 2000,
        reward: "₹50 OFF on orders above ₹299",
        codePrefix: "WOF-MEAL-50",
        minOrder: 299,
        active: true,
        description: "Awarded to players who run 2,000 meters across Selvapuram."
      },
      {
        id: "off-1003",
        title: "WOF VIP FEAST VOUCHER",
        conditionType: "distance",
        threshold: 3000,
        reward: "₹100 OFF on orders above ₹499",
        codePrefix: "WOFRUSH-100",
        minOrder: 499,
        active: true,
        description: "Legendary runner award for crossing 3,000 meters."
      },
      {
        id: "off-1004",
        title: "WOF HIGH ROLLER SCORE VOUCHER",
        conditionType: "score",
        threshold: 35000,
        reward: "₹75 OFF on orders above ₹349",
        codePrefix: "WOF-SCORE-75",
        minOrder: 349,
        active: true,
        description: "Achieve arcade combo score of 35,000+ points."
      },
      {
        id: "off-1005",
        title: "WOF EXPRESS COURIER REWARD",
        conditionType: "deliveries",
        threshold: 2,
        reward: "FREE Kovai Falooda Shake with any order",
        codePrefix: "WOF-FALOO-FREE",
        minOrder: 0,
        active: true,
        description: "Successfully complete at least 2 emergency food deliveries."
      },
      {
        id: "off-1006",
        title: "WOF COMBO MASTER REWARD",
        conditionType: "meals",
        threshold: 4,
        reward: "25% OFF on all Gourmet Wraps & Burgers",
        codePrefix: "WOF-COMBO-25",
        minOrder: 250,
        active: true,
        description: "Collect and complete 4 full WOF meal combos."
      }
    ];
  }

  renderOffersView() {
    const offers = this.offersCache || this.getLocalOffers();
    const query = (this.adminOffersSearchInput ? this.adminOffersSearchInput.value.toLowerCase().trim() : '');
    const filter = this.activeOffersFilter || 'all';

    // Counts for KPIs & Filter pills
    const totalActive = offers.filter(o => o.active !== false).length;
    const distCount = offers.filter(o => (o.conditionType || o.type) === 'distance').length;
    const scoreCount = offers.filter(o => (o.conditionType || o.type) === 'score').length;
    const missionCount = offers.filter(o => ['deliveries', 'meals'].includes(o.conditionType || o.type)).length;

    if (this.kpiTotalOffers) this.kpiTotalOffers.textContent = totalActive;
    if (this.kpiDistOffers) this.kpiDistOffers.textContent = distCount;
    if (this.kpiScoreOffers) this.kpiScoreOffers.textContent = scoreCount;
    if (this.kpiMissionOffers) this.kpiMissionOffers.textContent = missionCount;

    if (this.offersCountAll) this.offersCountAll.textContent = offers.length;
    if (this.offersCountDist) this.offersCountDist.textContent = distCount;
    if (this.offersCountScore) this.offersCountScore.textContent = scoreCount;
    if (this.offersCountMissions) this.offersCountMissions.textContent = missionCount;
    if (this.navCountOffers) this.navCountOffers.textContent = totalActive;

    // Filter matching offers
    const filtered = offers.filter(o => {
      const type = (o.conditionType || o.type || 'distance').toLowerCase();
      if (filter === 'distance' && type !== 'distance') return false;
      if (filter === 'score' && type !== 'score') return false;
      if (filter === 'missions' && type !== 'deliveries' && type !== 'meals') return false;

      if (query) {
        const titleMatch = (o.title || '').toLowerCase().includes(query);
        const rewardMatch = (o.reward || '').toLowerCase().includes(query);
        const prefixMatch = (o.codePrefix || o.prefix || '').toLowerCase().includes(query);
        return titleMatch || rewardMatch || prefixMatch;
      }
      return true;
    });

    if (!this.adminOffersTbody) return;

    if (filtered.length === 0) {
      this.adminOffersTbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:32px; color:#94A3B8;">
            No milestone offers match your filter. Click "+ CREATE MILESTONE OFFER" to add one!
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    filtered.forEach(offer => {
      const type = (offer.conditionType || offer.type || 'distance').toLowerCase();
      let typeLabel = '';
      let typeBadgeClass = type;
      if (type === 'distance') {
        typeLabel = `🎯 Distance ≥ ${Number(offer.threshold).toLocaleString()}m`;
      } else if (type === 'score') {
        typeLabel = `⭐ Score ≥ ${Number(offer.threshold).toLocaleString()} pts`;
      } else if (type === 'deliveries') {
        typeLabel = `📦 Deliveries ≥ ${offer.threshold}`;
      } else if (type === 'meals') {
        typeLabel = `🍔 Meals ≥ ${offer.threshold}`;
      }

      const isActive = offer.active !== false;
      const statusPill = isActive
        ? `<span class="offer-status-badge active" onclick="window.uiManager.toggleOfferActive('${offer.id}')" title="Click to toggle active state">🟢 Active</span>`
        : `<span class="offer-status-badge inactive" onclick="window.uiManager.toggleOfferActive('${offer.id}')" title="Click to toggle active state">⚪ Paused</span>`;

      const prefix = offer.codePrefix || offer.prefix || 'WOF';
      const minOrderText = (offer.minOrder && Number(offer.minOrder) > 0) ? `₹${offer.minOrder}` : 'No Min';

      html += `
        <tr>
          <td><span class="offer-condition-badge ${typeBadgeClass}">${typeLabel}</span></td>
          <td>
            <div style="font-weight:800; color:#F8FAFC;">${(offer.title || '').replace(/"/g, '&quot;')}</div>
            <div style="font-size:11px; color:#94A3B8;">${(offer.description || '').replace(/"/g, '&quot;')}</div>
          </td>
          <td style="font-weight:700; color:#FDE047;">${(offer.reward || '').replace(/"/g, '&quot;')}</td>
          <td><code style="background:rgba(0,0,0,0.5); padding:3px 7px; border-radius:4px; color:#38BDF8; font-weight:700;">${prefix}-XXXX</code></td>
          <td style="color:#CBD5E1;">${minOrderText}</td>
          <td>${statusPill}</td>
          <td>
            <div style="display:flex; gap:6px;">
              <button class="table-action-btn edit" onclick="window.uiManager.openOfferModal('${offer.id}')" title="Edit offer">✏️ Edit</button>
              <button class="table-action-btn delete" onclick="window.uiManager.deleteOffer('${offer.id}')" title="Delete offer">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    });

    this.adminOffersTbody.innerHTML = html;
  }

  filterOffersTable() {
    this.renderOffersView();
  }

  openOfferModal(offerId = null) {
    if (!this.adminOfferSubmodal) return;
    this.adminOfferSubmodal.classList.remove('hidden');

    if (offerId) {
      const offer = (this.offersCache || []).find(o => o.id === offerId);
      if (offer) {
        if (this.offerModalTitle) this.offerModalTitle.textContent = `✏️ EDIT: ${offer.title.toUpperCase()}`;
        if (this.editOfferId) this.editOfferId.value = offer.id;
        if (this.editOfferTitle) this.editOfferTitle.value = offer.title || '';
        if (this.editOfferType) this.editOfferType.value = offer.conditionType || offer.type || 'distance';
        if (this.editOfferThreshold) this.editOfferThreshold.value = offer.threshold || 1000;
        if (this.editOfferReward) this.editOfferReward.value = offer.reward || '';
        if (this.editOfferPrefix) this.editOfferPrefix.value = offer.codePrefix || offer.prefix || 'WOF';
        if (this.editOfferMinOrder) this.editOfferMinOrder.value = offer.minOrder || 0;
        if (this.editOfferDesc) this.editOfferDesc.value = offer.description || '';
        if (this.editOfferActive) this.editOfferActive.checked = offer.active !== false;
        this.updateOfferThresholdLabel();
        return;
      }
    }

    // New offer
    if (this.offerModalTitle) this.offerModalTitle.textContent = '+ CREATE MILESTONE REWARD OFFER';
    if (this.editOfferId) this.editOfferId.value = '';
    if (this.editOfferTitle) this.editOfferTitle.value = '';
    if (this.editOfferType) this.editOfferType.value = 'distance';
    if (this.editOfferThreshold) this.editOfferThreshold.value = '1000';
    if (this.editOfferReward) this.editOfferReward.value = '';
    if (this.editOfferPrefix) this.editOfferPrefix.value = 'WOF-REWARD';
    if (this.editOfferMinOrder) this.editOfferMinOrder.value = '0';
    if (this.editOfferDesc) this.editOfferDesc.value = '';
    if (this.editOfferActive) this.editOfferActive.checked = true;
    this.updateOfferThresholdLabel();
  }

  closeOfferModal() {
    if (this.adminOfferSubmodal) this.adminOfferSubmodal.classList.add('hidden');
  }

  updateOfferThresholdLabel() {
    const type = this.editOfferType ? this.editOfferType.value : 'distance';
    if (!this.editOfferThresholdLbl) return;
    if (type === 'distance') {
      this.editOfferThresholdLbl.textContent = 'Distance Milestone Threshold * (meters e.g. 1000)';
    } else if (type === 'score') {
      this.editOfferThresholdLbl.textContent = 'Score Milestone Threshold * (points e.g. 35000)';
    } else if (type === 'deliveries') {
      this.editOfferThresholdLbl.textContent = 'Completed Deliveries Threshold * (e.g. 2)';
    } else if (type === 'meals') {
      this.editOfferThresholdLbl.textContent = 'Completed Meal Combos Threshold * (e.g. 4)';
    }
  }

  handleSaveOffer() {
    const title = this.editOfferTitle ? this.editOfferTitle.value.trim() : '';
    const reward = this.editOfferReward ? this.editOfferReward.value.trim() : '';
    const prefix = this.editOfferPrefix ? this.editOfferPrefix.value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '') : 'WOF';
    const threshold = parseFloat(this.editOfferThreshold ? this.editOfferThreshold.value : 0) || 1;

    if (!title) {
      alert('Please enter an offer title');
      return;
    }
    if (!reward) {
      alert('Please enter the reward or discount description');
      return;
    }

    const offerId = this.editOfferId && this.editOfferId.value ? this.editOfferId.value : ('off-' + Date.now().toString().slice(-6));
    const offerObj = {
      id: offerId,
      title: title.slice(0, 60),
      conditionType: this.editOfferType ? this.editOfferType.value : 'distance',
      threshold: threshold,
      reward: reward.slice(0, 100),
      codePrefix: prefix || 'WOF',
      minOrder: parseFloat(this.editOfferMinOrder ? this.editOfferMinOrder.value : 0) || 0,
      description: this.editOfferDesc ? this.editOfferDesc.value.trim().slice(0, 140) : '',
      active: this.editOfferActive ? this.editOfferActive.checked : true,
      updatedAt: new Date().toISOString()
    };

    if (!this.offersCache) this.offersCache = this.getLocalOffers();
    const existingIdx = this.offersCache.findIndex(o => o.id === offerId);
    if (existingIdx >= 0) {
      this.offersCache[existingIdx] = offerObj;
    } else {
      this.offersCache.push(offerObj);
    }

    this.saveOffersLocally(this.offersCache);

    fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offerObj)
    }).catch(() => {});

    this.closeOfferModal();
    this.renderOffersView();
    this.showFloatingToast(`Offer "${offerObj.title}" saved! ✓`, '#10B981', 2500);
  }

  deleteOffer(offerId) {
    const offer = (this.offersCache || []).find(o => o.id === offerId);
    const title = offer ? offer.title : 'offer';
    if (!confirm(`Are you sure you want to delete milestone offer "${title}"?`)) return;

    this.offersCache = (this.offersCache || []).filter(o => o.id !== offerId);
    this.saveOffersLocally(this.offersCache);

    fetch('/api/offers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: offerId })
    }).catch(() => {});

    this.renderOffersView();
    this.showFloatingToast(`Offer "${title}" deleted`, '#EF4444', 2000);
  }

  toggleOfferActive(offerId) {
    const offer = (this.offersCache || []).find(o => o.id === offerId);
    if (!offer) return;

    offer.active = offer.active === false ? true : false;
    this.saveOffersLocally(this.offersCache);

    fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offer)
    }).catch(() => {});

    this.renderOffersView();
    this.showFloatingToast(`Offer ${offer.active ? 'Activated 🟢' : 'Paused ⚪'}`, '#FDE047', 1800);
  }

  resetOffersToDefault() {
    if (!confirm('Reset all milestone offers to standard WOF restaurant reward defaults?')) return;
    this.offersCache = this.getDefaultOffersList();
    this.saveOffersLocally(this.offersCache);

    this.offersCache.forEach(offer => {
      fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offer)
      }).catch(() => {});
    });

    this.renderOffersView();
    this.showFloatingToast('Reset milestone offers to standard defaults! ✓', '#10B981', 2500);
  }

  // --- TAB 3: FOOD COST % & MARGIN ANALYZER ---
  initFoodCostAnalyzer() {
    this.updateFoodCostSimulation();
    this.calculatePeriodFoodCost();
    this.renderMenuEngineeringMatrix();
  }

  updateFoodCostSimulation() {
    const price = parseFloat(this.simPriceSlider ? this.simPriceSlider.value : 189) || 189;
    const cost = parseFloat(this.simCostSlider ? this.simCostSlider.value : 54) || 54;

    if (this.simPriceVal) this.simPriceVal.textContent = `₹${price}`;
    if (this.simCostVal) this.simCostVal.textContent = `₹${cost}`;

    const fcPct = price > 0 ? (cost / price) * 100 : 0;
    const grossProfit = price - cost;
    const laborPct = 28.0;
    const overheadPct = 18.0;
    const netProfitPct = Math.max(0, 100 - fcPct - laborPct - overheadPct);

    // Segment widths
    if (this.simSegFood) {
      this.simSegFood.style.width = `${Math.min(100, fcPct).toFixed(1)}%`;
      this.simSegFood.textContent = `Food ${fcPct.toFixed(1)}%`;
    }
    if (this.simSegLabor) {
      this.simSegLabor.style.width = `${laborPct}%`;
    }
    if (this.simSegOverhead) {
      this.simSegOverhead.style.width = `${overheadPct}%`;
    }
    if (this.simSegProfit) {
      this.simSegProfit.style.width = `${netProfitPct.toFixed(1)}%`;
      this.simSegProfit.textContent = `Net ${netProfitPct.toFixed(1)}%`;
    }

    // Health Badge
    if (this.simHealthBadge) {
      if (fcPct < 28) {
        this.simHealthBadge.className = 'cost-badge healthy';
        this.simHealthBadge.textContent = `🟢 ${fcPct.toFixed(1)}% Food Cost (High Profit Driver)`;
      } else if (fcPct <= 34) {
        this.simHealthBadge.className = 'cost-badge healthy';
        this.simHealthBadge.textContent = `🟢 ${fcPct.toFixed(1)}% Food Cost (Optimal QSR Benchmark)`;
      } else if (fcPct <= 40) {
        this.simHealthBadge.className = 'cost-badge moderate';
        this.simHealthBadge.textContent = `🟡 ${fcPct.toFixed(1)}% Food Cost (Moderate / Thin Margin)`;
      } else {
        this.simHealthBadge.className = 'cost-badge warning';
        this.simHealthBadge.textContent = `🔴 ${fcPct.toFixed(1)}% Food Cost (High Alert / Loss Risk)`;
      }
    }

    // Legend
    if (this.simFoodLbl) this.simFoodLbl.textContent = `${fcPct.toFixed(1)}% (₹${cost.toFixed(2)})`;
    if (this.simNetProfitLbl) {
      const netVal = (price * netProfitPct) / 100;
      this.simNetProfitLbl.textContent = `${netProfitPct.toFixed(1)}% (~₹${netVal.toFixed(2)})`;
    }

    // Advice explanation
    if (this.simAdviceBox) {
      let advice = '';
      if (fcPct < 28) {
        advice = `<b>💡 Excellent Profit Driver:</b> Food cost is very lean at <b>${fcPct.toFixed(1)}%</b>. Each sale yields <b>₹${grossProfit.toFixed(2)} gross profit</b> (Gross Margin: <b>${(100 - fcPct).toFixed(1)}%</b>). This item heavily subsidizes kitchen labor and rent.`;
      } else if (fcPct <= 34) {
        advice = `<b>💡 Golden QSR Range:</b> At <b>${fcPct.toFixed(1)}%</b>, this item matches the standard fast-food industry benchmark (28%–32%). For every ₹100 earned, ₹${fcPct.toFixed(1)} pays for food, leaving <b>₹${grossProfit.toFixed(2)}</b> to cover labor, store expenses, and net profit.`;
      } else if (fcPct <= 40) {
        advice = `<b>⚠️ Thin Operating Margin:</b> At <b>${fcPct.toFixed(1)}%</b>, food cost is eating into net profit. After 28% labor and 18% overheads, net profit is squeezed to <b>${netProfitPct.toFixed(1)}%</b>. Consider bundling with high-margin drinks or trimming portion size slightly.`;
      } else {
        advice = `<b>🚨 Loss Warning:</b> Food cost at <b>${fcPct.toFixed(1)}%</b> is unsustainable. After kitchen staff and utilities, this item operating at a net loss. <b>Recommended:</b> Raise price to at least <b>₹${Math.ceil((cost / 0.3) / 10) * 10 + 9}</b> or reduce ingredient costs.`;
      }
      this.simAdviceBox.innerHTML = advice;
    }

    // Inflation Impact
    if (this.simInflationDetails) {
      const inflatedCost = cost * 1.10;
      const inflatedFcPct = (inflatedCost / price) * 100;
      const targetPct = 0.30;
      const adjustedPrice = Math.max(price, Math.ceil((inflatedCost / targetPct) / 10) * 10 + 9);

      this.simInflationDetails.innerHTML = `
        If supplier ingredient prices surge by +10% (Cost: <b>₹${inflatedCost.toFixed(2)}</b>), your food cost climbs to <b style="color:${inflatedFcPct > 35 ? '#FF5252' : '#FFD000'}">${inflatedFcPct.toFixed(1)}%</b>. To restore a 30% food cost target, the selling price should be adjusted to <b style="color:var(--wof-yellow);">₹${adjustedPrice}</b>.
      `;
    }
  }

  calculatePeriodFoodCost() {
    const begin = parseFloat(this.periodInvBegin ? this.periodInvBegin.value : 0) || 0;
    const purchases = parseFloat(this.periodPurchases ? this.periodPurchases.value : 0) || 0;
    const end = parseFloat(this.periodInvEnd ? this.periodInvEnd.value : 0) || 0;
    const sales = parseFloat(this.periodSales ? this.periodSales.value : 0) || 0;

    const cogs = Math.max(0, begin + purchases - end);
    const fcPct = sales > 0 ? (cogs / sales) * 100 : 0;

    if (this.periodCogsVal) this.periodCogsVal.textContent = `₹${Math.round(cogs).toLocaleString('en-IN')}`;
    if (this.periodFcVal) {
      this.periodFcVal.textContent = `${fcPct.toFixed(1)}%`;
      this.periodFcVal.style.color = fcPct < 30 ? '#00E676' : (fcPct <= 35 ? '#FFD000' : '#FF5252');
    }
    if (this.periodStatusVal) {
      if (fcPct < 30) {
        this.periodStatusVal.className = 'cost-badge healthy';
        this.periodStatusVal.textContent = '🟢 Optimal (Under 30% Target)';
      } else if (fcPct <= 35) {
        this.periodStatusVal.className = 'cost-badge moderate';
        this.periodStatusVal.textContent = '🟡 Acceptable (30% - 35% Range)';
      } else {
        this.periodStatusVal.className = 'cost-badge warning';
        this.periodStatusVal.textContent = '🔴 High Food Cost Alert (> 35% Waste / Spoilage)';
      }
    }
  }

  renderMenuEngineeringMatrix() {
    const items = this.menuItemsCache;
    if (!this.matrixStarsList || items.length === 0) return;

    // Calculate median margin and median popularity
    const margins = items.map(it => it.price > 0 ? ((it.price - it.cost) / it.price) * 100 : 0).sort((a, b) => a - b);
    const pops = items.map(it => it.popularity || 800).sort((a, b) => a - b);

    const medianMargin = margins[Math.floor(margins.length / 2)] || 70;
    const medianPop = pops[Math.floor(pops.length / 2)] || 1000;

    let starsHtml = '';
    let plowhorsesHtml = '';
    let puzzlesHtml = '';
    let dogsHtml = '';

    items.forEach(it => {
      const margin = it.price > 0 ? ((it.price - it.cost) / it.price) * 100 : 0;
      const pop = it.popularity || 800;
      const chip = `
        <div class="quadrant-chip" onclick="window.uiManager.openInRecipeCalculator('${it.id}')" style="cursor:pointer;" title="Click to view in Recipe Calculator">
          <span>${it.icon || '🍔'} ${it.name}</span>
          <small>₹${it.price} (${margin.toFixed(0)}% mgn)</small>
        </div>
      `;

      if (margin >= medianMargin && pop >= medianPop) {
        starsHtml += chip;
      } else if (margin < medianMargin && pop >= medianPop) {
        plowhorsesHtml += chip;
      } else if (margin >= medianMargin && pop < medianPop) {
        puzzlesHtml += chip;
      } else {
        dogsHtml += chip;
      }
    });

    if (this.matrixStarsList) this.matrixStarsList.innerHTML = starsHtml || '<div style="font-size:11px; color:#78909C;">No items in this quadrant.</div>';
    if (this.matrixPlowhorsesList) this.matrixPlowhorsesList.innerHTML = plowhorsesHtml || '<div style="font-size:11px; color:#78909C;">No items in this quadrant.</div>';
    if (this.matrixPuzzlesList) this.matrixPuzzlesList.innerHTML = puzzlesHtml || '<div style="font-size:11px; color:#78909C;">No items in this quadrant.</div>';
    if (this.matrixDogsList) this.matrixDogsList.innerHTML = dogsHtml || '<div style="font-size:11px; color:#78909C;">No items in this quadrant.</div>';
  }

  getLocalLeads() {
    try {
      return JSON.parse(localStorage.getItem('wof_rush_admin_leads') || '[]');
    } catch (e) {
      return [];
    }
  }

  mergeLeads(serverLeads) {
    const local = this.getLocalLeads();
    const map = new Map();
    serverLeads.forEach(l => map.set(l.id || l.phone, l));
    local.forEach(l => {
      if (!map.has(l.id || l.phone)) {
        map.set(l.id || l.phone, l);
      }
    });
    return Array.from(map.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  renderAdminView() {
    const leads = this.adminLeadsCache;

    // Calculate KPIs
    const totalPlayers = leads.length;
    const totalDistMeters = leads.reduce((sum, l) => sum + (l.distance || 0), 0);
    const totalCoupons = leads.filter(l => l.couponCode && l.distance >= 1000).length;
    const totalRedeemed = leads.filter(l => l.redeemed).length;

    if (this.kpiTotalPlayers) this.kpiTotalPlayers.textContent = totalPlayers;
    if (this.kpiTotalDistance) this.kpiTotalDistance.textContent = (totalDistMeters / 1000).toFixed(1) + ' km';
    if (this.kpiCouponsIssued) this.kpiCouponsIssued.textContent = totalCoupons;
    if (this.kpiCouponsRedeemed) this.kpiCouponsRedeemed.textContent = totalRedeemed;

    this.renderAdminTable(leads);
  }

  renderAdminTable(leads) {
    if (!this.adminLeadsTbody) return;

    if (leads.length === 0) {
      this.adminLeadsTbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#90A4AE;">No player leads recorded yet. Play a run to add data!</td></tr>`;
      return;
    }

    let html = '';
    leads.forEach((l, index) => {
      const dt = new Date(l.timestamp);
      const timeStr = isNaN(dt.getTime()) ? 'Recent' : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const phoneClean = (l.phone || '').replace(/[^\d]/g, '');
      const couponText = l.couponCode ? `<b>${l.couponCode}</b><br><small style="color:#FFE082">${l.couponTitle}</small>` : `<span style="color:#78909C">None (< 1,000m)</span>`;
      const distBadge = l.distance >= 1000 ? `<span class="dist-badge unlocked">${l.distance}m ✓</span>` : `<span class="dist-badge locked">${l.distance}m</span>`;
      const redeemedClass = l.redeemed ? 'redeemed' : 'unused';
      const redeemedLabel = l.redeemed ? 'REDEEMED ✓' : 'MARK REDEEMED';

      const waMsg = encodeURIComponent(`Hi ${l.name}! Thanks for playing WOF RUSH in Selvapuram. Your voucher code is: ${l.couponCode || 'N/A'}`);
      const waLink = phoneClean.length === 10 ? `<a href="https://wa.me/91${phoneClean}?text=${waMsg}" target="_blank" class="phone-link" title="Open WhatsApp Chat">📱 ${phoneClean} ↗</a>` : phoneClean;

      html += `
        <tr>
          <td>#${index + 1}</td>
          <td>${timeStr}</td>
          <td><b>${l.name}</b></td>
          <td>${waLink}</td>
          <td>${distBadge}</td>
          <td>${(l.score || 0).toLocaleString()}</td>
          <td>${couponText}</td>
          <td>
            <button class="redeem-toggle-btn ${redeemedClass}" onclick="window.uiManager.toggleLeadRedeem('${l.id}')">
              ${redeemedLabel}
            </button>
          </td>
        </tr>
      `;
    });

    this.adminLeadsTbody.innerHTML = html;
  }

  toggleLeadRedeem(id) {
    const lead = this.adminLeadsCache.find(l => l.id === id);
    if (!lead) return;
    lead.redeemed = !lead.redeemed;

    // Update server
    fetch('/api/leads/toggle-redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    }).catch(() => {});

    // Update local cache
    try {
      localStorage.setItem('wof_rush_admin_leads', JSON.stringify(this.adminLeadsCache));
    } catch (e) {}

    this.renderAdminView();
  }

  filterAdminTable() {
    const query = (this.adminSearchInput ? this.adminSearchInput.value.toLowerCase().trim() : '');
    if (!query) {
      this.renderAdminTable(this.adminLeadsCache);
      return;
    }
    const filtered = this.adminLeadsCache.filter(l =>
      (l.name && l.name.toLowerCase().includes(query)) ||
      (l.phone && l.phone.includes(query)) ||
      (l.couponCode && l.couponCode.toLowerCase().includes(query))
    );
    this.renderAdminTable(filtered);
  }

  exportLeadsToCSV() {
    const leads = this.adminLeadsCache;
    if (leads.length === 0) {
      alert('No leads available to export.');
      return;
    }

    const headers = ['ID', 'Date Time', 'Player Name', 'Phone Number', 'Distance (m)', 'Score', 'Meals Completed', 'Deliveries', 'Coupon Code', 'Coupon Title', 'Redeemed'];
    const rows = leads.map(l => [
      l.id,
      new Date(l.timestamp).toISOString(),
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${l.phone || ''}"`,
      l.distance,
      l.score,
      l.meals,
      l.deliveries,
      `"${l.couponCode || 'None'}"`,
      `"${(l.couponTitle || '').replace(/"/g, '""')}"`,
      l.redeemed ? 'Yes' : 'No'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `WOF_RUSH_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  copyPhoneNumbersList() {
    const phones = this.adminLeadsCache
      .map(l => (l.phone || '').replace(/[^\d]/g, ''))
      .filter(p => p.length === 10);
    const unique = [...new Set(phones)];

    if (unique.length === 0) {
      alert('No phone numbers recorded yet.');
      return;
    }

    const text = unique.join(', ');
    navigator.clipboard.writeText(text).then(() => {
      if (this.adminCopyPhonesBtn) {
        this.adminCopyPhonesBtn.textContent = 'COPIED! ✓';
        setTimeout(() => { this.adminCopyPhonesBtn.textContent = '📋 COPY PHONES'; }, 2000);
      }
    });
  }

  // --- LOCAL LEADERBOARD ---
  initLeaderboard() {
    const defaultLeaderboard = [
      { name: 'Arun (Selvapuram)', score: 48920 },
      { name: 'Karthi (Townhall)', score: 46210 },
      { name: 'Priya (RS Puram)', score: 43880 },
      { name: 'Vignesh (Gandhipuram)', score: 38150 },
      { name: 'Deepa (Kovai)', score: 31200 }
    ];

    try {
      if (!localStorage.getItem('wof_rush_leaderboard')) {
        localStorage.setItem('wof_rush_leaderboard', JSON.stringify(defaultLeaderboard));
      }
    } catch (e) {}
  }

  initAdminData() {
    // Pre-populate demo leads in localStorage if none exist
    try {
      if (!localStorage.getItem('wof_rush_admin_leads')) {
        const demoLeads = [
          { id: 'L-1001', name: 'Arun Kumar', phone: '9842156789', score: 48920, distance: 2450, meals: 6, deliveries: 3, couponCode: 'WOFRUSH-100-8412', couponTitle: 'WOF VIP FEAST VOUCHER', redeemed: false, timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
          { id: 'L-1002', name: 'Karthi Keyan', phone: '9789123450', score: 46210, distance: 2180, meals: 5, deliveries: 2, couponCode: 'WOF-MEAL-50-6190', couponTitle: 'WOF CRAVE VOUCHER', redeemed: true, timestamp: new Date(Date.now() - 3600000 * 12).toISOString() },
          { id: 'L-1003', name: 'Priya Sundaram', phone: '9944567812', score: 43880, distance: 1850, meals: 4, deliveries: 2, couponCode: 'WOF-MEAL-50-3321', couponTitle: 'WOF CRAVE VOUCHER', redeemed: false, timestamp: new Date(Date.now() - 3600000 * 24).toISOString() },
          { id: 'L-1004', name: 'Vignesh R', phone: '9443128901', score: 28400, distance: 1250, meals: 3, deliveries: 1, couponCode: 'WOF-FREEFRIES-9021', couponTitle: 'WOF CRISPY REWARD', redeemed: false, timestamp: new Date(Date.now() - 3600000 * 30).toISOString() },
          { id: 'L-1005', name: 'Deepa M', phone: '9655234109', score: 14200, distance: 780, meals: 1, deliveries: 0, couponCode: null, couponTitle: 'None (< 1,000m)', redeemed: false, timestamp: new Date(Date.now() - 3600000 * 48).toISOString() }
        ];
        localStorage.setItem('wof_rush_admin_leads', JSON.stringify(demoLeads));
      }
    } catch (e) {}
  }

  getLeaderboard() {
    try {
      const data = localStorage.getItem('wof_rush_leaderboard');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  addLeaderboardEntry(name, score) {
    const lb = this.getLeaderboard();
    lb.push({ name, score });
    lb.sort((a, b) => b.score - a.score);
    const top = lb.slice(0, 10);
    try {
      localStorage.setItem('wof_rush_leaderboard', JSON.stringify(top));
    } catch (e) {}
  }

  openLeaderboard() {
    const lb = this.getLeaderboard();
    const container = document.getElementById('leaderboard-list');
    let html = '';

    lb.forEach((entry, i) => {
      const rank = i + 1;
      const rankClass = rank === 1 ? 'gold' : (rank === 2 ? 'silver' : (rank === 3 ? 'bronze' : ''));
      html += `
        <div class="leaderboard-row ${rankClass}">
          <span class="rank">#${rank}</span>
          <span class="player-name">${entry.name}</span>
          <span class="player-score">${entry.score.toLocaleString()}</span>
        </div>
      `;
    });

    container.innerHTML = html;
    this.leaderboardModal.classList.remove('hidden');
  }
}

// Global UI instance
window.uiManager = null;
window.addEventListener('DOMContentLoaded', () => {
  window.uiManager = new UIManager();
});
