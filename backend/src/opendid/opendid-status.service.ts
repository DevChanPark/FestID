import { Injectable } from '@nestjs/common';
import { OpenDidConfigService } from './opendid.config';
import { OpenDidHttpService } from './opendid-http.service';

type ComponentStatus = {
  configured: boolean;
  baseUrl?: string;
  healthPath?: string;
  reachable?: boolean;
  error?: string;
  apiDocsReachable?: boolean;
  apiDocsError?: string;
  requiredPaths?: Record<string, boolean>;
};

@Injectable()
export class OpenDidStatusService {
  constructor(
    private readonly openDidConfigService: OpenDidConfigService,
    private readonly openDidHttpService: OpenDidHttpService,
  ) {}

  async getStatus(options?: { probe?: boolean }) {
    const issuer = await this.componentStatus({
      baseUrl: this.openDidConfigService.issuerBaseUrl,
      healthPath: this.openDidConfigService.issuerHealthPath,
      probe: options?.probe,
      requiredPaths: [
        this.openDidConfigService.issueOfferPath,
        this.openDidConfigService.issueInspectProposePath,
        this.openDidConfigService.issueProfilePath,
        this.openDidConfigService.issuePath,
        this.openDidConfigService.issueCompletePath,
        this.openDidConfigService.issueResultPath,
        this.openDidConfigService.revokePath,
      ],
    });
    const verifier = await this.componentStatus({
      baseUrl: this.openDidConfigService.verifierBaseUrl,
      healthPath: this.openDidConfigService.verifierHealthPath,
      probe: options?.probe,
      requiredPaths: [
        this.openDidConfigService.verifyOfferPath,
        this.openDidConfigService.verifyProfilePath,
        this.openDidConfigService.verifyPath,
        this.openDidConfigService.verifyConfirmPath,
      ],
    });

    return {
      mode: this.openDidConfigService.mode,
      enabled: {
        credentialIssuance:
          this.openDidConfigService.credentialIssuanceEnabled,
        verification: this.openDidConfigService.verificationEnabled,
      },
      modes: {
        credentialIssue: this.openDidConfigService.credentialIssueMode,
        credentialVerify: this.openDidConfigService.credentialVerifyMode,
      },
      components: {
        issuer,
        verifier,
      },
      issuer: {
        did: this.openDidConfigService.issuerDid,
        kidConfigured: Boolean(this.openDidConfigService.issuerKid),
        serviceId: this.openDidConfigService.issuerServiceId,
      },
      paths: {
        issue: this.openDidConfigService.issuePath,
        revoke: this.openDidConfigService.revokePath,
        verify: this.openDidConfigService.verifyPath,
        issueOffer: this.openDidConfigService.issueOfferPath,
        issueInspectPropose:
          this.openDidConfigService.issueInspectProposePath,
        issueProfile: this.openDidConfigService.issueProfilePath,
        issueComplete: this.openDidConfigService.issueCompletePath,
        issueResult: this.openDidConfigService.issueResultPath,
        verifyOffer: this.openDidConfigService.verifyOfferPath,
        verifyProfile: this.openDidConfigService.verifyProfilePath,
        verifyConfirm: this.openDidConfigService.verifyConfirmPath,
      },
      schemas: {
        entry: this.openDidConfigService.getCredentialConfig('entry'),
        adult: this.openDidConfigService.getCredentialConfig('adult'),
        student: this.openDidConfigService.getCredentialConfig('student'),
        staff: this.openDidConfigService.getCredentialConfig('staff'),
        admin: this.openDidConfigService.getCredentialConfig('admin'),
      },
      secrets: {
        apiTokenConfigured: Boolean(this.openDidConfigService.apiToken),
      },
    };
  }

  private async componentStatus(input: {
    baseUrl?: string;
    healthPath?: string;
    probe?: boolean;
    requiredPaths?: string[];
  }): Promise<ComponentStatus> {
    const status: ComponentStatus = {
      configured: Boolean(input.baseUrl),
      baseUrl: input.baseUrl,
      healthPath: input.healthPath,
    };

    if (!input.probe || !input.baseUrl || !input.healthPath) {
      return status;
    }

    const probedStatus: ComponentStatus = { ...status };

    if (input.healthPath) {
      try {
        await this.openDidHttpService.get<Record<string, unknown>>(
          input.baseUrl,
          input.healthPath,
        );
        probedStatus.reachable = true;
      } catch (error) {
        probedStatus.reachable = false;
        probedStatus.error =
          error instanceof Error ? error.message : 'OpenDID probe failed.';
      }
    }

    if (input.requiredPaths?.length) {
      try {
        const apiDocs = await this.openDidHttpService.get<{
          paths?: Record<string, unknown>;
        }>(input.baseUrl, '/api-docs');
        probedStatus.apiDocsReachable = true;
        probedStatus.requiredPaths = Object.fromEntries(
          input.requiredPaths.map((path) => [
            path,
            Boolean(apiDocs.paths?.[path]),
          ]),
        );
      } catch (error) {
        probedStatus.apiDocsReachable = false;
        probedStatus.apiDocsError =
          error instanceof Error
            ? error.message
            : 'OpenDID API docs probe failed.';
      }
    }

    return probedStatus;
  }
}
