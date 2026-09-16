import { ServiceScope } from '@microsoft/sp-core-library';
import { MSGraphClientFactory } from '@microsoft/sp-http';
import { IResolvedSettings } from './data/config';

export interface IAiTechBarProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  /** E-mail zalogowanego użytkownika — prefill danych rezerwacji. */
  userEmail: string;
  /** Fabryka klienta Graph — rezerwacja wizyt (Bookings, free/busy). */
  graphFactory?: MSGraphClientFactory;
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
