import { AppEvents } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';
import { ButtonGroup, Menu, ToolbarButton, WithContextMenu } from '@grafana/ui';
import React from 'react';

export function PageOptions() {
  const share = async () => {
    try {
      const response = await fetch('/api/short-urls', {
        method: 'post',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: window.location.pathname.substring(1) + window.location.search,
        }),
      });
      if (!response.ok) {
        throw new Error();
      }
      const data = await response.json();
      await navigator.clipboard.writeText(data.url);
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertSuccess.name,
        payload: ['Shortened link copied to clipboard'],
      });
    } catch (err) {
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertError.name,
        payload: [`Failed to copy shortened link: ${err?.toString()}`],
      });
    }
  };

  return (
    <>
      <WithContextMenu
        renderMenuItems={() => (
          <Menu.Group>
            <Menu.Item icon="share-alt" label="Share" onClick={() => share()} />
            <Menu.Item
              icon="camera"
              label="Screenshot"
              target="_blank"
              url={`/render${window.location.pathname + window.location.search}&height=-1&width=1800&scale=1&kiosk=true&hideNav=true&fullPageImage=true`}
            />
          </Menu.Group>
        )}
      >
        {({ openMenu }) => (
          <ButtonGroup>
            <ToolbarButton
              variant="canvas"
              tooltip="Options"
              isOpen={false}
              narrow={true}
              onClick={openMenu}
            />
          </ButtonGroup>
        )}
      </WithContextMenu>
    </>
  );
}
