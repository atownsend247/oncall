import React, { useCallback, useState } from 'react';

import { Button, HorizontalGroup, Drawer, VerticalGroup } from '@grafana/ui';
import cn from 'classnames/bind';
import { debounce } from 'lodash-es';
import { observer } from 'mobx-react';

import { TemplateForEdit } from 'components/AlertTemplates/AlertTemplatesForm.config';
import CheatSheet from 'components/CheatSheet/CheatSheet';
import {
  groupingTemplateCheatSheet,
  slackMessageTemplateCheatSheet,
  webTitleTemplateCheatSheet,
} from 'components/CheatSheet/CheatSheet.config';
import Block from 'components/GBlock/Block';
import MonacoJinja2Editor from 'components/MonacoJinja2Editor/MonacoJinja2Editor';
import Text from 'components/Text/Text';
import TemplatePreview from 'containers/TemplatePreview/TemplatePreview';
import TemplatesAlertGroupsList from 'containers/TemplatesAlertGroupsList/TemplatesAlertGroupsList';
import { AlertReceiveChannel } from 'models/alert_receive_channel/alert_receive_channel.types';
import { Alert } from 'models/alertgroup/alertgroup.types';

import styles from './IntegrationTemplate.module.css';

const cx = cn.bind(styles);

interface IntegrationTemplateProps {
  id: AlertReceiveChannel['id'];
  template: TemplateForEdit;
  templateBody: string;
  onHide: () => void;
  onUpdateTemplates: (values: any) => void;
  onUpdateRoute: (values: any) => void;
}

const IntegrationTemplate = observer((props: IntegrationTemplateProps) => {
  const { id, onHide, template, onUpdateTemplates, onUpdateRoute, templateBody } = props;

  const [isCheatSheetVisible, setIsCheatSheetVisible] = useState<boolean>(false);
  const [chatOps, setChatOps] = useState(undefined);
  const [alertGroupPayload, setAlertGroupPayload] = useState<JSON>(undefined);
  const [changedTemplateBody, setChangedTemplateBody] = useState<string>(templateBody);
  const [resultError, setResultError] = useState<string>(undefined);

  const onShowCheatSheet = useCallback(() => {
    setIsCheatSheetVisible(true);
  }, []);

  const onCloseCheatSheet = useCallback(() => {
    setIsCheatSheetVisible(false);
  }, []);

  const getChangeHandler = () => {
    return debounce((value: string) => {
      setChangedTemplateBody(value);
    }, 1000);
  };

  const onEditPayload = (alertPayload: string) => {
    if (alertPayload !== null) {
      try {
        const jsonPayload = JSON.parse(alertPayload);
        if (typeof jsonPayload === 'object') {
          setResultError(undefined);
          setAlertGroupPayload(JSON.parse(alertPayload));
        } else {
          setResultError('Please check your JSON format');
        }
      } catch (e) {
        setResultError(e.message);
      }
    } else {
      setResultError(undefined);
      setAlertGroupPayload(undefined);
    }
  };

  const onSelectAlertGroup = useCallback((alertGroup: Alert) => {
    if (template.additionalData?.chatOpsName) {
      setChatOps({
        permalink: alertGroup?.permalinks[template.additionalData?.chatOpsName],
        name: template.additionalData?.chatOpsName,
        comment: template.additionalData?.data,
      });
    }
  }, []);

  const onSaveAndFollowLink = useCallback(
    (link: string) => {
      onHide();
      window.open(link, '_blank');
    },
    [onUpdateTemplates, onUpdateRoute, changedTemplateBody]
  );

  const handleSubmit = useCallback(() => {
    template.isRoute
      ? onUpdateRoute({ [template.name]: changedTemplateBody })
      : onUpdateTemplates({ [template.name]: changedTemplateBody });

    onHide();
  }, [onUpdateTemplates, changedTemplateBody]);

  const getCheatSheet = (templateName) => {
    switch (templateName) {
      case 'Grouping':
      case 'Autoresolve':
        return groupingTemplateCheatSheet;
      case 'Web titile':
      case 'Web message':
      case 'Web image':
        return webTitleTemplateCheatSheet;
      case 'Auto acknowledge':
      case 'Source link':
      case 'Phone call':
      case 'SMS':
      case 'Slack title':
      case 'Slack message':
      case 'Slack image':
      case 'Telegram title':
      case 'Telegram message':
      case 'Telegram image':
      case 'Email title':
      case 'Email message':
        return slackMessageTemplateCheatSheet;
      default:
        return webTitleTemplateCheatSheet;
    }
  };
  return (
    <>
      <Drawer
        title={
          <div className={cx('title-container')}>
            <HorizontalGroup justify="space-between" align="flex-start">
              <VerticalGroup>
                <Text.Title level={3}>Edit {template.displayName} template</Text.Title>
                {template.description && <Text type="secondary">{template.description}</Text>}
              </VerticalGroup>

              <HorizontalGroup>
                <Button variant="secondary" onClick={onHide}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                  Save
                </Button>
              </HorizontalGroup>
            </HorizontalGroup>
          </div>
        }
        onClose={onHide}
        closeOnMaskClick={false}
        width={'95%'}
      >
        <div className={cx('container')}>
          <TemplatesAlertGroupsList
            alertReceiveChannelId={id}
            onEditPayload={onEditPayload}
            onSelectAlertGroup={onSelectAlertGroup}
          />
          {isCheatSheetVisible ? (
            <CheatSheet cheatSheetData={getCheatSheet(template.displayName)} onClose={onCloseCheatSheet} />
          ) : (
            <>
              <div className={cx('template-block-codeeditor')}>
                <div className={cx('template-editor-block-title')}>
                  <HorizontalGroup justify="space-between">
                    <Text>Template editor</Text>

                    <Button variant="secondary" fill="outline" onClick={onShowCheatSheet} icon="book" size="sm">
                      Cheatsheat
                    </Button>
                  </HorizontalGroup>
                </div>

                <MonacoJinja2Editor
                  value={templateBody}
                  data={undefined}
                  showLineNumbers={true}
                  height={'100vh'}
                  onChange={getChangeHandler()}
                />
              </div>
            </>
          )}
          {/* {alertGroupPayload || resultError ? ( */}
          <Result
            alertReceiveChannelId={id}
            templateName={template.name}
            templateBody={changedTemplateBody}
            alertGroup={undefined}
            chatOps={chatOps}
            payload={alertGroupPayload}
            error={resultError}
            onSaveAndFollowLink={onSaveAndFollowLink}
          />
          {/* ) : (
            <div className={cx('template-block-result')}>
              <div className={cx('template-block-title')}>
                <Text>Please select Alert group to see end result</Text>
              </div>
            </div>
          )} */}
        </div>
      </Drawer>
    </>
  );
});

interface ResultProps {
  alertReceiveChannelId: AlertReceiveChannel['id'];
  templateName: string;
  templateBody: string;
  alertGroup?: Alert;
  chatOps?: { permalink: string; name: string; comment?: string };
  payload?: JSON;
  error?: string;
  onSaveAndFollowLink?: (link: string) => void;
}

const Result = (props: ResultProps) => {
  const { alertReceiveChannelId, templateName, chatOps, payload, templateBody, error, onSaveAndFollowLink } = props;

  return (
    <div className={cx('template-block-result')}>
      <div className={cx('template-block-title')}>
        <HorizontalGroup justify="space-between">
          <Text>Result</Text>
        </HorizontalGroup>
      </div>
      <div className={cx('result')}>
        {payload || error ? (
          <VerticalGroup spacing="lg">
            {error ? (
              <Block bordered fullWidth withBackground>
                <Text>{error}</Text>
              </Block>
            ) : (
              <Block bordered fullWidth className={cx('block-style')}>
                <TemplatePreview
                  key={templateName}
                  templateName={templateName}
                  templateBody={templateBody}
                  alertReceiveChannelId={alertReceiveChannelId}
                  payload={payload}
                />
              </Block>
            )}

            {chatOps && (
              <VerticalGroup>
                <Button onClick={() => onSaveAndFollowLink(chatOps.permalink)}>
                  Save and open Alert Group in {chatOps.name}
                </Button>

                {chatOps.comment && (
                  <Text type="secondary">
                    Click "Acknowledge" and then "Unacknowledge" in Slack to trigger re-rendering.
                  </Text>
                )}
              </VerticalGroup>
            )}
          </VerticalGroup>
        ) : (
          <div>
            <Block bordered fullWidth className={cx('block-style')}>
              <Text>You do not have any input data to render result. Please select Alert group to see end result</Text>
            </Block>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationTemplate;
