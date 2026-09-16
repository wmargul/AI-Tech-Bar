import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version, DisplayMode } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneToggle,
  PropertyPaneLabel,
  PropertyPaneSlider
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'AiTechBarWebPartStrings';
import AiTechBar from './components/AiTechBar';
import { IAiTechBarProps } from './components/IAiTechBarProps';
import { TOOLS, BOOKING, resolveSettings, toolOpenKey, toolRequestKey, ILinkSettings } from './components/data/config';

export interface IAiTechBarWebPartProps extends ILinkSettings {
  description: string;
  fullScreen: boolean;
  leftOffset: number;
  creditUpn: string;
}

// Domyślny autor pokazywany w karcie osoby przy credits (można nadpisać w Property Pane).
const DEFAULT_CREDIT_UPN = 'wiktor.margul@wbdcontractor.com';

export default class AiTechBarWebPart extends BaseClientSideWebPart<IAiTechBarWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const element: React.ReactElement<IAiTechBarProps> = React.createElement(
      AiTechBar,
      {
        description: this.properties.description,
        isDarkTheme: this._isDarkTheme,
        environmentMessage: this._environmentMessage,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        userDisplayName: this.context.pageContext.user.displayName,
        userEmail: this.context.pageContext.user.email || this.context.pageContext.user.loginName || '',
        graphFactory: this.context.msGraphClientFactory,
        settings: resolveSettings(this.properties),
        isEditMode: this.displayMode === DisplayMode.Edit,
        fullScreen: this.properties.fullScreen !== false,
        leftOffset: typeof this.properties.leftOffset === 'number' ? this.properties.leftOffset : 0,
        serviceScope: this.context.serviceScope,
        creditUpn: (this.properties.creditUpn && this.properties.creditUpn.trim())
          ? this.properties.creditUpn.trim()
          : DEFAULT_CREDIT_UPN
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
    });
  }



  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }

  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    // Pola linków per narzędzie (Otwórz + Wniosek) generowane z konfiguracji.
    const toolLinkFields = TOOLS.reduce((fields, tool) => {
      if (tool.isAllTools) {
        fields.push(
          PropertyPaneTextField(toolOpenKey(tool.id), {
            label: `${tool.name} — pełna lista`
          })
        );
        return fields;
      }
      fields.push(
        PropertyPaneTextField(toolOpenKey(tool.id), {
          label: `${tool.name} — Otwórz`
        }),
        PropertyPaneTextField(toolRequestKey(tool.id), {
          label: `${tool.name} — Wniosek`
        })
      );
      return fields;
    }, [] as ReturnType<typeof PropertyPaneTextField>[]);

    return {
      pages: [
        {
          header: {
            description: 'AI Tech Bar — konfiguracja linków'
          },
          groups: [
            {
              groupName: 'Wygląd',
              groupFields: [
                PropertyPaneToggle('fullScreen', {
                  label: 'Tryb pełnoekranowy',
                  onText: 'Włączony',
                  offText: 'Wyłączony'
                }),
                PropertyPaneSlider('leftOffset', {
                  label: 'Odsunięcie od lewej (pasek SharePoint), px',
                  min: 0,
                  max: 120,
                  step: 4,
                  showValue: true
                }),
                PropertyPaneTextField('creditUpn', {
                  label: 'Autor — UPN / email (karta osoby przy credits)',
                  description: `Domyślnie ${DEFAULT_CREDIT_UPN}. Wpisz pełny UPN/email, aby nadpisać.`
                })
              ]
            },
            {
              groupName: 'Linki ogólne',
              groupFields: [
                PropertyPaneTextField('linkBooking', { label: 'Rezerwacja (Booking)' }),
                PropertyPaneTextField('linkPolicy', { label: 'Pełna Polityka AI' }),
                PropertyPaneTextField('linkAllTools', { label: 'Pełna lista narzędzi' }),
                PropertyPaneTextField('linkVideoTraining', { label: 'Szkolenia Wideo' }),
                PropertyPaneTextField('linkPrompts', { label: 'Prompty & Triki' }),
                PropertyPaneTextField('linkNews', { label: 'Wszystkie aktualności (News)' })
              ]
            },
            {
              groupName: 'Rezerwacja wizyt',
              groupFields: [
                PropertyPaneTextField('bookingBusinessId', {
                  label: 'Kalendarz Bookings — adres skrzynki',
                  description: `Domyślnie ${BOOKING.businessId}. To ten sam identyfikator, który występuje w publicznym linku do rezerwacji.`
                }),
                PropertyPaneTextField('bookingTimeZone', {
                  label: 'Strefa czasowa kalendarza',
                  description: `Nazwa IANA, np. ${BOOKING.timeZone}. W tej strefie interpretowane są godziny pracy Tech Baru.`
                }),
                PropertyPaneToggle('bookingDemoMode', {
                  label: 'Tryb demonstracyjny',
                  onText: 'Włączony',
                  offText: 'Wyłączony'
                }),
                PropertyPaneLabel('bookingDemoModeHint', {
                  text: 'Pokazuje przykładowe terminy bez łączenia się z Microsoft Graph — '
                    + 'do przeglądu przepływu, dopóki administrator nie zatwierdzi uprawnień. '
                    + 'Wizyty nie są zapisywane. Wyłącz przed publikacją.'
                })
              ]
            },
            {
              groupName: 'Linki narzędzi AI',
              isCollapsed: true,
              groupFields: toolLinkFields
            },
            {
              groupName: strings.BasicGroupName,
              isCollapsed: true,
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
