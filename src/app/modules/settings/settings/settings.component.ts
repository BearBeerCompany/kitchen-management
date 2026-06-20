import {Component, OnDestroy, OnInit} from '@angular/core';
import {I18nService} from "../../../services/i18n.service";
import {Subscription} from "rxjs";
import {Plate} from "../../plates/plate.interface";
import {PlateService} from "../../plates/services/plate.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {ConfirmationService, MessageService} from "primeng/api";
import { GsgIntegrationService } from '../../shared/service/gsg-integration.service';
import { GsgIntegrationResult } from '../../shared/interface/gsg-integration.interface';
import { DelayThresholdsService, DelayThresholds } from '../../../services/delay-thresholds.service';
import { ThemeService } from '../../../services/theme.service';
import { PlatePairsService, PlatePair } from '../../plates/services/plate-pairs.service';
import { Router } from '@angular/router';
import { CategoryService } from '../../plate-menu-items/services/category.service';
import { Category, CategoryMapping, CategoryMappingType, MenuItem } from '../../plate-menu-items/plate-menu-item';
import { CategoryMappingService } from '../../plate-menu-items/services/category-mapping.service';
import { MenuItemsService } from '../../plate-menu-items/services/menu-items.service';

@Component({
  selector: 'settings',
  templateUrl: 'settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {

  public readonly i18n: any;

  public display: boolean = false;
  public formReady: boolean = false;
  public isEditMode: boolean = false;
  public selectedPlate?: Plate;
  public plates: Plate[] = [];
  public form?: FormGroup | undefined;
  public showNotify: boolean = false;
  public showItemDelays: boolean = false;
  public delayThresholds: DelayThresholds = { warning: 10, danger: 20 };
  public isDarkTheme: boolean = false;
  public currentLanguage: 'it' | 'en' = 'it';
  public availableLanguages: {code: 'it' | 'en', label: string, flag: string}[] = [];
  public categories: Category[] = [];

  // Category Mapping
  public categoryMappings: CategoryMapping[] = [];
  public menuItems: MenuItem[] = [];
  public displayMappingDialog: boolean = false;
  public isEditMappingMode: boolean = false;
  public selectedMappingId?: string;
  public mappingForm?: FormGroup;
  public readonly mappingTypeEnum = CategoryMappingType;
  public mappingTypeOptions: { label: string, value: CategoryMappingType }[] = [];

  // Plate Pairs
  public platePairs: PlatePair[] = [];
  public displayPairDialog: boolean = false;
  public isEditPairMode: boolean = false;
  public selectedPairId?: string;
  public pairForm?: FormGroup;

  // Color Picker Palette
  public primaryColors: string[] = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'
  ];

  private subs: Subscription = new Subscription();

  constructor(public i18nService: I18nService,
              private _platesService: PlateService,
              private _messageService: MessageService,
              private _gsgIntegrationService: GsgIntegrationService,
              private _confirmationService: ConfirmationService,
              private _delayThresholdsService: DelayThresholdsService,
              private _themeService: ThemeService,
              private _platePairsService: PlatePairsService,
              private _router: Router,
              private _categoryService: CategoryService,
              private _categoryMappingService: CategoryMappingService,
              private _menuItemsService: MenuItemsService) {
    this.i18n = i18nService.instance;
  }

  public ngOnInit(): void {
    this._platesService.getAll().subscribe(plates => {
      this.plates = plates;
    });
    this._categoryService.getAll().subscribe(categories => {
      this.categories = categories;
    });
    this._menuItemsService.getAll().subscribe(items => {
      this.menuItems = items;
    });
    this._loadCategoryMappings();
    this.mappingTypeOptions = [
      {label: this.i18n.SETTINGS.CATEGORY_MAPPING.TYPE_ITEM, value: CategoryMappingType.Item},
      {label: this.i18n.SETTINGS.CATEGORY_MAPPING.TYPE_CATEGORY, value: CategoryMappingType.Category}
    ];
    this._loadSettingsFromLocalStorage();
    this.delayThresholds = this._delayThresholdsService.getThresholds();
    this.isDarkTheme = this._themeService.getCurrentTheme() === 'dark';

    // Load current language and available languages
    this.availableLanguages = this.i18nService.getAvailableLanguages();
    this.subs.add(
      this.i18nService.currentLanguage$.subscribe(lang => {
        this.currentLanguage = lang;
      })
    );

    // Load plate pairs
    this.subs.add(
      this._platePairsService.pairs$.subscribe(pairs => {
        this.platePairs = pairs;
      })
    );

    this.form = new FormGroup({
      name: new FormControl("", Validators.required),
      color: new FormControl("", Validators.required),
      number: new FormControl(0, [Validators.required, Validators.pattern("^[0-9]*$")]),
      quickMoveEnabled: new FormControl(false),
      quickMoveTargetPlateId: new FormControl(""),
      categories: new FormControl([])
    });

    this.pairForm = new FormGroup({
      name: new FormControl("", Validators.required),
      plateId1: new FormControl("", Validators.required),
      plateId2: new FormControl("", Validators.required)
    });

    this.mappingForm = new FormGroup({
      type: new FormControl(CategoryMappingType.Item, Validators.required),
      externalItemId: new FormControl(null),
      sourceExternalCategoryId: new FormControl(null),
      targetExternalCategoryId: new FormControl(null, Validators.required),
      description: new FormControl(""),
      id: new FormControl(null)
    });
  }

  public ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  public onGSGInit() {
    this._confirmationService.confirm({
      message: `Confermi di voler inizializzare categorie e voci di menù da GSG?\nCosì perderai i dati di ordini, categorie e voci di menù!`,
      accept: () => {
        this.subs.add(
          this._gsgIntegrationService.initGsg().subscribe((res: GsgIntegrationResult) => {
            console.log(res);
            this._messageService.add({
              severity: 'success',
              summary: 'App inizializzata',
              detail: `L'applicazione è stata inizializzata da GSG correttamente`
            });
            // refresh categories and menu items used by the category mapping form
            this._categoryService.getAll().subscribe(categories => this.categories = categories);
            this._menuItemsService.getAll().subscribe(items => this.menuItems = items);
          })
        );
      }
    });
  }

  // ========================================
  // Category Mapping Methods
  // ========================================

  private _loadCategoryMappings(): void {
    this._categoryMappingService.getAll().subscribe(mappings => this.categoryMappings = mappings);
  }

  public showMappingDialog(): void {
    this.isEditMappingMode = false;
    this.selectedMappingId = undefined;
    this.mappingForm?.reset({
      type: CategoryMappingType.Item,
      externalItemId: null,
      sourceExternalCategoryId: null,
      targetExternalCategoryId: null,
      description: "",
      id: null
    });
    this.displayMappingDialog = true;
  }

  public showEditMappingDialog(mapping: CategoryMapping): void {
    this.isEditMappingMode = true;
    this.selectedMappingId = mapping.id;
    this.mappingForm?.reset({
      type: mapping.externalItemId != null ? CategoryMappingType.Item : CategoryMappingType.Category,
      externalItemId: mapping.externalItemId ?? null,
      sourceExternalCategoryId: mapping.sourceExternalCategoryId ?? null,
      targetExternalCategoryId: mapping.targetExternalCategoryId ?? null,
      description: mapping.description ?? "",
      id: mapping.id ?? null
    });
    this.displayMappingDialog = true;
  }

  public get isItemMapping(): boolean {
    return this.mappingForm?.get('type')?.value === CategoryMappingType.Item;
  }

  public onMappingTypeChange(): void {
    // clear the field that is not relevant for the selected type
    if (this.isItemMapping) {
      this.mappingForm?.get('sourceExternalCategoryId')?.setValue(null);
    } else {
      this.mappingForm?.get('externalItemId')?.setValue(null);
    }
  }

  public isMappingValid(): boolean {
    if (!this.mappingForm) return false;
    const targetSet = this.mappingForm.get('targetExternalCategoryId')?.value != null;
    const sourceSet = this.isItemMapping
      ? this.mappingForm.get('externalItemId')?.value != null
      : this.mappingForm.get('sourceExternalCategoryId')?.value != null;
    return targetSet && sourceSet;
  }

  public saveMapping(): void {
    if (!this.isMappingValid()) return;

    const value = this.mappingForm!.value;
    const dto: CategoryMapping = {
      targetExternalCategoryId: value.targetExternalCategoryId,
      description: value.description || undefined,
      externalItemId: value.type === CategoryMappingType.Item ? value.externalItemId : undefined,
      sourceExternalCategoryId: value.type === CategoryMappingType.Category ? value.sourceExternalCategoryId : undefined
    };

    if (this.isEditMappingMode && this.selectedMappingId) {
      dto.id = this.selectedMappingId;
    }

    const request$ = this.isEditMappingMode
      ? this._categoryMappingService.update(dto)
      : this._categoryMappingService.create(dto);

    request$.subscribe({
      next: () => {
        this._messageService.add({
          severity: 'success',
          summary: this.isEditMappingMode ? 'Mappatura Modificata' : 'Mappatura Creata',
          detail: `La mappatura è stata ${this.isEditMappingMode ? 'modificata' : 'creata'} con successo`
        });
        this.displayMappingDialog = false;
        this._loadCategoryMappings();
      },
      error: () => {
        this._messageService.add({
          severity: 'error',
          summary: 'Errore',
          detail: 'Impossibile salvare la mappatura'
        });
      }
    });
  }

  public deleteMapping(mapping: CategoryMapping): void {
    this._confirmationService.confirm({
      message: this.i18n.SETTINGS.CATEGORY_MAPPING.DELETE_CONFIRM,
      accept: () => {
        this._categoryMappingService.delete(mapping.id!).subscribe(() => {
          this._messageService.add({
            severity: 'success',
            summary: 'Mappatura Eliminata',
            detail: 'La mappatura è stata eliminata'
          });
          this._loadCategoryMappings();
        });
      }
    });
  }

  public isItemMappingRow(mapping: CategoryMapping): boolean {
    return mapping.externalItemId != null;
  }

  public getCategoryNameByExternalId(externalId?: number): string {
    if (externalId == null) return this.i18n.SETTINGS.CATEGORY_MAPPING.UNKNOWN;
    const category = this.categories.find(c => c.externalId === externalId);
    return category?.name ?? `#${externalId}`;
  }

  public getItemNameByExternalId(externalId?: number): string {
    if (externalId == null) return this.i18n.SETTINGS.CATEGORY_MAPPING.UNKNOWN;
    const item = this.menuItems.find(i => i.externalId === externalId);
    return item?.name ?? `#${externalId}`;
  }

  public getMappingSourceLabel(mapping: CategoryMapping): string {
    return this.isItemMappingRow(mapping)
      ? this.getItemNameByExternalId(mapping.externalItemId)
      : this.getCategoryNameByExternalId(mapping.sourceExternalCategoryId);
  }

  public onDelete(id: string): void {
    this._platesService.delete(id).subscribe(
      () => this._platesService.getAll().subscribe(plates => this.plates = plates));
  }

  public onSubmit(): void {
    const plateId = this.selectedPlate?.id;
    const quickMoveEnabled = this.form?.get("quickMoveEnabled")?.value;
    const quickMoveTargetPlateId = this.form?.get("quickMoveTargetPlateId")?.value;
    const expandedDoneButtonEnabled = this.form?.get("expandedDoneButtonEnabled")?.value;

    if (this.isEditMode) {
      // Update existing plate
      this._platesService.update({
        ...this.form?.value,
        enabled: true,
        slot: [0, this.form?.get("number")?.value],
        id: plateId,
        categories: this.form?.get("categories")?.value || []
      }).subscribe(
        _ => {
          // Salva quickMove settings in localStorage
          this._saveQuickMoveSettings(plateId!, quickMoveEnabled, quickMoveTargetPlateId);
          // Salva expandedDoneButton settings in localStorage
          this._saveExpandedDoneButtonSettings(plateId!, expandedDoneButtonEnabled);
          
          this._messageService.add({
            severity: 'success',
            summary: 'Piastra Modificata',
            detail: `La piastra "${this.form?.value.name}" è stata modificata con successo`
          });
          this._platesService.getAll().subscribe(plates => {
            this.plates = plates;
            this.display = false;
          });
        });
    } else {
      // Create new plate
      this._platesService.create({
        ...this.form?.value,
        enabled: false,
        slot: [0, this.form?.get("number")?.value],
        categories: this.form?.get("categories")?.value || []
      }).subscribe(
        (createdPlate: Plate) => {
          // Salva quickMove settings in localStorage
          if (createdPlate.id) {
            this._saveQuickMoveSettings(createdPlate.id, quickMoveEnabled, quickMoveTargetPlateId);
            // Salva expandedDoneButton settings in localStorage
            this._saveExpandedDoneButtonSettings(createdPlate.id, expandedDoneButtonEnabled);
          }
          
          this._messageService.add({
            severity: 'success',
            summary: 'Piastra Creata',
            detail: `La piastra "${this.form?.value.name}" è stata creata con successo`
          });
          this._platesService.getAll().subscribe(plates => {
            this.plates = plates;
            this.display = false;
          });
        });
    }
  }

  public discardForm(): void {
    this.form?.reset();
    this.display = false;
    this.formReady = false;
  }

  public showCreateDialog(): void {
    this.isEditMode = false;
    this.selectedPlate = undefined;
    this.formReady = false;
    this.display = false;
    
    // Crea il form e poi mostra il dialog
    setTimeout(() => {
      this.form = new FormGroup({
        name: new FormControl("", Validators.required),
        color: new FormControl("#3b82f6", Validators.required),
        number: new FormControl(0, [Validators.required, Validators.pattern("^[0-9]*$")]),
        quickMoveEnabled: new FormControl(false),
        quickMoveTargetPlateId: new FormControl(""),
        expandedDoneButtonEnabled: new FormControl(false),
        categories: new FormControl([])
      });
      this.formReady = true;
      this.display = true;
    }, 0);
  }

  public showEditDialog(id: string) {
    this.isEditMode = true;
    this.formReady = false;
    this.display = false;
    
    this._platesService.getById(id).subscribe(
      (plate: Plate) => {
        this.selectedPlate = plate;
        
        // Carica quickMove settings dal localStorage
        const quickMoveSettings = this._loadQuickMoveSettings(id);
        // Carica expandedDoneButton settings dal localStorage
        const expandedDoneButtonEnabled = this._loadExpandedDoneButtonSettings(id);
        
        // Crea il form e poi mostra il dialog
        setTimeout(() => {
          this.form = new FormGroup({
            name: new FormControl(plate.name, Validators.required),
            color: new FormControl(plate.color, Validators.required),
            number: new FormControl(plate.slot![1], [Validators.required, Validators.pattern("^[0-9]*$")]),
            quickMoveEnabled: new FormControl(quickMoveSettings.enabled),
            quickMoveTargetPlateId: new FormControl(quickMoveSettings.targetPlateId),
            expandedDoneButtonEnabled: new FormControl(expandedDoneButtonEnabled),
            categories: new FormControl(plate.categories || [])
          });
          this.formReady = true;
          this.display = true;
        }, 0);
      }
    );
  }

  public onSwitchPlate(event: { id: string, enable: boolean }) {
    this._platesService.switch(event.id, event.enable)
      .subscribe({
        next: (plate: Plate) => {
          this._messageService.add({
            severity: 'success',
            summary: `Piastra ${plate.enabled ? 'Accesa' : 'Spenta'}`,
            detail: `${plate.name} è stata ${plate.enabled ? 'accesa' : 'spenta'} con successo`
          });
          this._platesService.getAll().subscribe(plates => this.plates = plates)
        },
        error: (error) => {
          this._messageService.add({
            severity: 'error',
            summary: 'Errore',
            detail: `La piastra non è vuota, spostare tutti gli ordini prima di spegnerla`
          });
        }
      })
  }

  private _loadSettingsFromLocalStorage(): void {
    const savedShowNotify = localStorage.getItem('plates_showNotify');
    const savedShowItemDelays = localStorage.getItem('plates_showItemDelays');
    
    if (savedShowNotify !== null) {
      this.showNotify = savedShowNotify === 'true';
    }
    
    if (savedShowItemDelays !== null) {
      this.showItemDelays = savedShowItemDelays === 'true';
    }
  }

  public onThemeChange(): void {
    const newTheme = this.isDarkTheme ? 'dark' : 'light';
    this._themeService.setTheme(newTheme);
    this._messageService.add({
      severity: 'success',
      summary: 'Tema cambiato',
      detail: `Tema ${this.isDarkTheme ? 'scuro' : 'chiaro'} attivato`,
      life: 2000
    });
  }

  public onShowNotifyChange(): void {
    localStorage.setItem('plates_showNotify', this.showNotify.toString());
    this._messageService.add({
      severity: 'success',
      summary: 'Impostazioni salvate',
      detail: `Notifiche audio ${this.showNotify ? 'attivate' : 'disattivate'}`,
      life: 2000
    });
  }

  public onShowItemDelaysChange(): void {
    localStorage.setItem('plates_showItemDelays', this.showItemDelays.toString());
    this._messageService.add({
      severity: 'success',
      summary: 'Impostazioni salvate',
      detail: `Visualizzazione ritardi item ${this.showItemDelays ? 'attivata' : 'disattivata'}`,
      life: 2000
    });
  }

  public onDelayThresholdChange(): void {
    // Validate that warning < danger
    if (this.delayThresholds.warning >= this.delayThresholds.danger) {
      this._messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'La soglia di avviso deve essere inferiore alla soglia di pericolo',
        life: 3000
      });
      // Reset to saved values
      this.delayThresholds = this._delayThresholdsService.getThresholds();
      return;
    }

    this._delayThresholdsService.setThresholds(this.delayThresholds);
    this._messageService.add({
      severity: 'success',
      summary: 'Impostazioni salvate',
      detail: `Soglie ritardi aggiornate: ${this.delayThresholds.warning}min (giallo), ${this.delayThresholds.danger}min (rosso)`,
      life: 3000
    });
  }

  public resetDelayThresholds(): void {
    this._delayThresholdsService.resetToDefaults();
    this.delayThresholds = this._delayThresholdsService.getThresholds();
    this._messageService.add({
      severity: 'info',
      summary: 'Impostazioni ripristinate',
      detail: 'Soglie ritardi ripristinate ai valori predefiniti',
      life: 2000
    });
  }

  public getAvailablePlates(): Plate[] {
    return this.plates.filter(p => p.id !== this.selectedPlate?.id);
  }

  public getPlateSlotDisplay(plate: Plate): string {
    if (!plate.slot) return '0/0';
    // Mostra 0 invece di numeri negativi
    const used = Math.max(0, plate.slot[0]);
    const total = plate.slot[1];
    return `${used}/${total}`;
  }

  public getPlateSlotPercentage(plate: Plate): number {
    if (!plate.slot || plate.slot[1] === 0) return 0;
    // Calcola la percentuale, gestendo negativi
    const used = Math.max(0, plate.slot[0]);
    const total = plate.slot[1];
    return Math.min(100, (used / total) * 100);
  }

  private _saveQuickMoveSettings(plateId: string, enabled: boolean, targetPlateId: string): void {
    const settings = {
      enabled: enabled ?? false,
      targetPlateId: targetPlateId || ''
    };
    localStorage.setItem(`plate_quickMove_${plateId}`, JSON.stringify(settings));
  }

  private _loadQuickMoveSettings(plateId: string): { enabled: boolean, targetPlateId: string } {
    const saved = localStorage.getItem(`plate_quickMove_${plateId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return { enabled: false, targetPlateId: '' };
      }
    }
    return { enabled: false, targetPlateId: '' };
  }

  private _saveExpandedDoneButtonSettings(plateId: string, enabled: boolean): void {
    const settings = {
      enabled: enabled ?? false
    };
    localStorage.setItem(`plate_expandedDoneButton_${plateId}`, JSON.stringify(settings));
  }

  private _loadExpandedDoneButtonSettings(plateId: string): boolean {
    const saved = localStorage.getItem(`plate_expandedDoneButton_${plateId}`);
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        return settings.enabled;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  // ========================================
  // Plate Pairs Methods
  // ========================================

  public showPairDialog(): void {
    this.isEditPairMode = false;
    this.selectedPairId = undefined;
    this.pairForm?.reset();
    this.displayPairDialog = true;
  }

  public showEditPairDialog(pair: PlatePair): void {
    this.isEditPairMode = true;
    this.selectedPairId = pair.id;
    this.pairForm?.patchValue({
      name: pair.name,
      plateId1: pair.plateId1,
      plateId2: pair.plateId2
    });
    this.displayPairDialog = true;
  }

  public savePair(): void {
    if (!this.pairForm?.valid) return;

    const formValue = this.pairForm.value;
    const plate1 = this.plates.find(p => p.id === formValue.plateId1);
    const plate2 = this.plates.find(p => p.id === formValue.plateId2);

    if (!plate1 || !plate2) {
      this._messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Selezionare entrambe le piastre'
      });
      return;
    }

    const pairData: Omit<PlatePair, 'id'> = {
      name: formValue.name,
      plateId1: formValue.plateId1,
      plateId2: formValue.plateId2,
      plateName1: plate1.name,
      plateName2: plate2.name
    };

    if (this.isEditPairMode && this.selectedPairId) {
      this._platePairsService.updatePair(this.selectedPairId, pairData);
      this._messageService.add({
        severity: 'success',
        summary: 'Coppia Modificata',
        detail: `La coppia "${formValue.name}" è stata modificata`
      });
    } else {
      this._platePairsService.addPair(pairData);
      this._messageService.add({
        severity: 'success',
        summary: 'Coppia Creata',
        detail: `La coppia "${formValue.name}" è stata creata`
      });
    }

    this.displayPairDialog = false;
  }

  public deletePair(pairId: string): void {
    this._confirmationService.confirm({
      message: 'Confermi di voler eliminare questa coppia di piastre?',
      accept: () => {
        this._platePairsService.deletePair(pairId);
        this._messageService.add({
          severity: 'success',
          summary: 'Coppia Eliminata',
          detail: 'La coppia è stata eliminata'
        });
      }
    });
  }

  public openPairView(pairId: string): void {
    window.open(`${window.location.origin}/#/plates/pair/${pairId}`, '_blank');
  }

  public copyPairLink(pairId: string): void {
    const url = `${window.location.origin}/#/plates/pair/${pairId}`;
    navigator.clipboard.writeText(url).then(() => {
      this._messageService.add({
        severity: 'success',
        summary: 'Link Copiato',
        detail: 'Il link è stato copiato negli appunti'
      });
    });
  }

  public getEnabledPlates(): Plate[] {
    return this.plates.filter(p => p.enabled);
  }

  public onLanguageChange(language: 'it' | 'en'): void {
    this.i18nService.setLanguage(language);
    
    // Mostra messaggio prima del reload
    this._messageService.add({
      severity: 'success',
      summary: language === 'it' ? 'Lingua Modificata' : 'Language Changed',
      detail: language === 'it' ? 'Ricaricamento in corso...' : 'Reloading...',
      life: 1000
    });
    
    // Ricarica la pagina dopo un breve delay per mostrare il messaggio
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

}
