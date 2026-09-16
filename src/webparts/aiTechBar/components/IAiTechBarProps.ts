import { ServiceScope } from '@microsoft/sp-core-library';
import { IResolvedSettings } from './data/config';

export interface IAiTechBarProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  settings: IResolvedSettings;
  /** ServiceScope web partu — wymagany przez kartę osoby (LivePersonaCard). */
  serviceScope: ServiceScope;
  /** UPN/email autora pokazywanego w karcie osoby przy credits. */
  creditUpn: string;
  /** Tryb edycji strony — wyłącza pełny ekran, by dało się edytować. */
  isEditMode: boolean;
  /** Czy włączyć tryb pełnoekranowy (fixed na całe okno). */
  fullScreen: boolean;
  /** Odsunięcie od lewej krawędzi (szerokość paska SharePoint), px. */
  leftOffset: number;
}
