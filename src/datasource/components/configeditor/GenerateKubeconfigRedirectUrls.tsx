import React from 'react';

import {
  Field,
  IconButton,
  InlineField,
  InlineFieldRow,
  Input,
} from '@grafana/ui';

interface Props {
  redirectUrls: string[];
  onChange: (redirectUrls: string[]) => void;
}

export function GenerateKubeconfigRedirectUrls({
  redirectUrls,
  onChange,
}: Props) {
  return (
    <>
      <Field label="Redirect Urls">
        <IconButton
          name="plus"
          aria-label="Add redirect url"
          onClick={(e) => {
            e.preventDefault();
            onChange([...redirectUrls, '']);
          }}
        />
      </Field>

      {redirectUrls.map((redirectUrl, index) => (
        <InlineFieldRow key={index}>
          <InlineField label="Redirect Url" labelWidth={20}>
            <Input
              width={40}
              placeholder="http://localhost:11716"
              value={redirectUrl}
              onChange={(e) => {
                const newRedirectUrls = [...redirectUrls];
                newRedirectUrls[index] = e.currentTarget.value;
                onChange(newRedirectUrls);
              }}
            />
          </InlineField>
          <IconButton
            name="trash-alt"
            aria-label="Remove redirect url"
            onClick={(e) => {
              e.preventDefault();
              const newRedirectUrls = [...redirectUrls];
              newRedirectUrls.splice(index, 1);
              onChange(newRedirectUrls);
            }}
          />
        </InlineFieldRow>
      ))}
    </>
  );
}
