import React, { useState, useCallback, ChangeEvent } from 'react';

import { Drawer, VerticalGroup, HorizontalGroup, Input, Tag, EmptySearchResult, Button } from '@grafana/ui';
import cn from 'classnames/bind';
import { observer } from 'mobx-react';

import Collapse from 'components/Collapse/Collapse';
import Block from 'components/GBlock/Block';
import GForm from 'components/GForm/GForm';
import IntegrationLogo from 'components/IntegrationLogo/IntegrationLogo';
import Text from 'components/Text/Text';
import { WithPermissionControlTooltip } from 'containers/WithPermissionControl/WithPermissionControlTooltip';
import { AlertReceiveChannel } from 'models/alert_receive_channel';
import { AlertReceiveChannelOption } from 'models/alert_receive_channel/alert_receive_channel.types';
import { useStore } from 'state/useStore';
import { UserActions } from 'utils/authorization';

import { form } from './IntegrationForm.config';
import { prepareForEdit } from './IntegrationForm.helpers';

import styles from './IntegrationForm.module.css';

const cx = cn.bind(styles);

interface IntegrationFormProps {
  id: AlertReceiveChannel['id'] | 'new';
  onHide: () => void;
  onUpdate: () => void;
}

const IntegrationForm = observer((props: IntegrationFormProps) => {
  const { id, onHide, onUpdate } = props;

  const store = useStore();

  const { alertReceiveChannelStore, userStore } = store;

  const user = userStore.currentUser;

  const [filterValue, setFilterValue] = useState('');
  const [showNewIntegrationForm, setShowNewIntegrationForm] = useState(false);
  // const [showIntegrationListForm, setShowIntegrationListForm] = useState(false);
  const [selectedOption, setSelectedOption] = useState<AlertReceiveChannelOption>(undefined);

  const data =
    id === 'new'
      ? { integration: selectedOption?.value, team: user.current_team }
      : prepareForEdit(alertReceiveChannelStore.items[id]);

  const integration = alertReceiveChannelStore.getIntegration(data);

  const handleSubmit = useCallback(
    (data: Partial<AlertReceiveChannel>) => {
      (id === 'new' ? alertReceiveChannelStore.create(data) : alertReceiveChannelStore.update(id, data)).then(() => {
        onHide();
        onUpdate();
      });
    },
    [id]
  );

  const handleNewIntegrationOptionSelectCallback = useCallback((option: AlertReceiveChannelOption) => {
    return () => {
      setSelectedOption(option);
      setShowNewIntegrationForm(true);
    };
  }, []);

  const handleChangeFilter = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFilterValue(e.currentTarget.value);
  }, []);

  const { alertReceiveChannelOptions } = alertReceiveChannelStore;

  const options = alertReceiveChannelOptions
    ? alertReceiveChannelOptions.filter((option: AlertReceiveChannelOption) =>
        option.display_name.toLowerCase().includes(filterValue.toLowerCase())
      )
    : [];

  return (
    <>
      {id === 'new' && (
        <Drawer scrollableContent title="New Integration" onClose={onHide} closeOnMaskClick={false}>
          <div className={cx('content')}>
            <VerticalGroup>
              <div className={cx('search-integration')}>
                <Input
                  autoFocus
                  value={filterValue}
                  placeholder="Search integrations ..."
                  onChange={handleChangeFilter}
                />
              </div>
              <div className={cx('cards')} data-testid="create-integration-modal">
                {options.length ? (
                  options.map((alertReceiveChannelChoice) => {
                    return (
                      <Block
                        bordered
                        shadowed
                        onClick={handleNewIntegrationOptionSelectCallback(alertReceiveChannelChoice)}
                        key={alertReceiveChannelChoice.value}
                        className={cx('card', { card_featured: alertReceiveChannelChoice.featured })}
                      >
                        <div className={cx('card-bg')}>
                          <IntegrationLogo integration={alertReceiveChannelChoice} scale={0.2} />
                        </div>
                        <div className={cx('title')}>
                          <VerticalGroup spacing="none">
                            <Text strong data-testid="integration-display-name">
                              {alertReceiveChannelChoice.display_name}
                            </Text>
                            <Text type="secondary" size="small">
                              {alertReceiveChannelChoice.short_description}
                            </Text>
                          </VerticalGroup>
                        </div>
                        {alertReceiveChannelChoice.featured && (
                          <Tag name="Quick connect" className={cx('tag')} colorIndex={7} />
                        )}
                      </Block>
                    );
                  })
                ) : (
                  <EmptySearchResult>Could not find anything matching your query</EmptySearchResult>
                )}
              </div>
            </VerticalGroup>
          </div>
        </Drawer>
      )}
      {(showNewIntegrationForm || id !== 'new') && (
        <Drawer
          scrollableContent
          title={
            id === 'new'
              ? `New ${selectedOption?.display_name} integration`
              : `Edit ${integration?.display_name} integration`
          }
          onClose={onHide}
          closeOnMaskClick={false}
        >
          <div className={cx('content')}>
            <VerticalGroup>
              <GForm form={form} data={data} onSubmit={handleSubmit} />
              <Collapse
                headerWithBackground
                className={cx('collapse')}
                isOpen={false}
                label={<Text type="link">How the integration works</Text>}
                contentClassName={cx('collapsable-content')}
              >
                <Text type="secondary">
                  The integration will generate the following:
                  <ul className={cx('integration-info-list')}>
                    <li className={cx('integration-info-item')}>Unique URL endpoint for receiving alerts </li>
                    <li className={cx('integration-info-item')}>
                      Templates to interpret alerts, tailored for Grafana Alerting{' '}
                    </li>
                    <li className={cx('integration-info-item')}>Grafana Alerting contact point </li>
                    <li className={cx('integration-info-item')}>Grafana Alerting notification</li>
                  </ul>
                  What you’ll need to do next:
                  <ul className={cx('integration-info-list')}>
                    <li className={cx('integration-info-item')}>
                      Finish connecting Monitoring system using Unique URL that will be provided on the next step{' '}
                    </li>
                    <li className={cx('integration-info-item')}>
                      Set up routes that are based on alert content, such as severity, region, and service{' '}
                    </li>
                    <li className={cx('integration-info-item')}>Connect escalation chains to the routes</li>
                    <li className={cx('integration-info-item')}>
                      Review templates and personalize according to your requirements
                    </li>
                  </ul>
                </Text>
              </Collapse>
              <HorizontalGroup justify="flex-end">
                {id === 'new' ? (
                  <Button variant="secondary" onClick={() => setShowNewIntegrationForm(false)}>
                    Back
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={onHide}>
                    Cancel
                  </Button>
                )}

                <WithPermissionControlTooltip userAction={UserActions.SchedulesWrite}>
                  <Button form={form.name} type="submit">
                    {id === 'new' ? 'Create' : 'Update'} Integration
                  </Button>
                </WithPermissionControlTooltip>
              </HorizontalGroup>
            </VerticalGroup>
          </div>
        </Drawer>
      )}
    </>
  );
});

export default IntegrationForm;
