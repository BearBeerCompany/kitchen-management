import { Component, OnInit } from '@angular/core';
import { PlatePair, PlatePairsService } from '../services/plate-pairs.service';
import { PlateService } from '../services/plate.service';
import { Plate } from '../plate.interface';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-plate-pairs-config',
  templateUrl: './plate-pairs-config.component.html',
  styleUrls: ['./plate-pairs-config.component.scss']
})
export class PlatePairsConfigComponent implements OnInit {
  public pairs: PlatePair[] = [];
  public availablePlates: Plate[] = [];
  public showAddDialog = false;
  public editingPair: PlatePair | null = null;
  
  // Form fields
  public newPairName = '';
  public selectedPlate1: Plate | null = null;
  public selectedPlate2: Plate | null = null;

  constructor(
    private _platePairsService: PlatePairsService,
    private _plateService: PlateService,
    private _router: Router,
    private _messageService: MessageService
  ) {}

  ngOnInit(): void {
    this._loadData();
  }

  private _loadData(): void {
    // Load pairs
    this._platePairsService.pairs$.subscribe(pairs => {
      this.pairs = pairs;
    });

    // Load available plates
    this._plateService.getAll().subscribe((plates: Plate[]) => {
      this.availablePlates = plates.filter(p => p.enabled);
    });
  }

  public openAddDialog(): void {
    this.editingPair = null;
    this.newPairName = '';
    this.selectedPlate1 = null;
    this.selectedPlate2 = null;
    this.showAddDialog = true;
  }

  public openEditDialog(pair: PlatePair): void {
    this.editingPair = pair;
    this.newPairName = pair.name;
    this.selectedPlate1 = this.availablePlates.find(p => p.id === pair.plateId1) || null;
    this.selectedPlate2 = this.availablePlates.find(p => p.id === pair.plateId2) || null;
    this.showAddDialog = true;
  }

  public closeDialog(): void {
    this.showAddDialog = false;
    this.editingPair = null;
  }

  public savePair(): void {
    if (!this.newPairName || !this.selectedPlate1 || !this.selectedPlate2) {
      return;
    }

    if (this.selectedPlate1.id === this.selectedPlate2.id) {
      alert('Seleziona due piastre diverse');
      return;
    }

    const pairData = {
      name: this.newPairName,
      plateId1: this.selectedPlate1.id!,
      plateId2: this.selectedPlate2.id!,
      plateName1: this.selectedPlate1.name,
      plateName2: this.selectedPlate2.name
    };

    if (this.editingPair) {
      this._platePairsService.updatePair(this.editingPair.id, pairData);
    } else {
      this._platePairsService.addPair(pairData);
    }

    this.closeDialog();
  }

  public deletePair(id: string): void {
    if (confirm('Sei sicuro di voler eliminare questa coppia?')) {
      this._platePairsService.deletePair(id);
    }
  }

  public openPairView(pairId: string): void {
    const url = `${window.location.origin}/#/plates/pair/${pairId}`;
    window.open(url, '_blank');
  }

  public goBack(): void {
    this._router.navigate(['/plates']);
  }

  public copyShareableLink(pair: PlatePair): void {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/#/plates/pair/shared?plate1=${pair.plateId1}&plate2=${pair.plateId2}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      this._messageService.add({
        severity: 'success',
        summary: 'Link copiato!',
        detail: 'Il link condivisibile è stato copiato negli appunti',
        life: 3000
      });
    }).catch(() => {
      this._messageService.add({
        severity: 'error',
        summary: 'Errore',
        detail: 'Impossibile copiare il link',
        life: 3000
      });
    });
  }
}
