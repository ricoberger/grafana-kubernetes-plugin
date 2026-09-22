import { VariableHide } from '@grafana/data';
import { TextBoxVariable as SceneTextBoxVariable } from '@grafana/scenes';
import { useSceneContext } from '@grafana/scenes-react';
import React, { ReactNode, useEffect, useState } from 'react';

interface TextBoxVariableProps {
  name: string;
  label?: string;
  hide?: VariableHide;
  skipUrlSync?: boolean;
  initialValue?: string;
  children: ReactNode;
}

export function TextBoxVariable({
  name,
  label,
  hide,
  skipUrlSync,
  initialValue,
  children,
}: TextBoxVariableProps) {
  const scene = useSceneContext();
  const [variableAdded, setVariableAdded] = useState(false);

  let variable = scene.findVariable(name) as SceneTextBoxVariable | undefined;
  if (!variable) {
    variable = new SceneTextBoxVariable({
      name,
      label,
      value: initialValue ?? '',
      hide,
      skipUrlSync,
    });
  }

  useEffect(() => {
    const removeFn = scene.addVariable(variable);
    // Gate children until the variable is registered so VariableControl and
    // interpolations can resolve it (mirrors @grafana/scenes-react's own
    // wrappers).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVariableAdded(true);
    return removeFn;
  }, [variable, scene, name]);

  useEffect(() => {
    variable?.setState({ label, hide, skipUrlSync });
  }, [label, hide, skipUrlSync, variable]);

  if (!variableAdded) {
    return null;
  }

  return <>{children}</>;
}
