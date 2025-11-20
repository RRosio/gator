import {
  Dialog,
  Notification,
  ReactWidget,
  showDialog
} from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { CreateEnvDrawer } from './components/CreateEnvDrawer';
import { IEnvironmentManager } from './tokens';
import React from 'react';

export async function createEnvironment(
  model: IEnvironmentManager,
  environmentName: string | undefined,
  shell?: any
): Promise<void> {
  // Preferred path: using MainAreaWidget
  if (shell) {
    try {
      const content = ReactWidget.create(
        <CreateEnvDrawer
          model={model}
          onClose={() => {
            content.dispose();
          }}
          onEnvironmentCreated={envName => {
            content.dispose();
          }}
        />
      );

      // Mount directly in the main area
      if (shell) {
        shell.add(content, 'main');
      }
    } catch (error) {
      console.error(error);
      Notification.error((error as any).message);
    }
  } else {
    // TODO: Test this fallback path
    // TODO: remove this fallback path in a future version
    // Deprecated fallback path: using Dialog
    console.warn(
      '[Gator] DEPRECATION WARNING: createEnvironment called without shell parameter. ' +
        'This fallback to Dialog mode is deprecated and will be removed in a future version. ' +
        'Please update your code to pass the shell parameter: ' +
        'registerEnvCommands(commands, model, shell). ' +
        'See: https://github.com/mamba-org/gator/issues/XXX'
    );

    // Use a ref object so the closure can access the dialog after it's created
    const dialogRef: { current: Dialog<any> | null } = { current: null };

    try {
      const body = ReactWidget.create(
        <CreateEnvDrawer
          model={model}
          onClose={() => {
            if (dialogRef.current) {
              dialogRef.current.dispose();
            }
          }}
          onEnvironmentCreated={envName => {
            if (dialogRef.current) {
              dialogRef.current.dispose();
            }
          }}
        />
      );

      const dialog = new Dialog({
        title: 'Create Environment',
        body,
        buttons: []
      });

      // Assign to ref so callbacks can access it
      dialogRef.current = dialog;

      dialog.addClass('jp-NbConda-CreateEnvDialog');
      await dialog.launch();
    } catch (error) {
      if (error !== 'cancelled') {
        console.error(error);
        Notification.error((error as any).message);
      }
    }
  }
}

export async function cloneEnvironment(
  model: IEnvironmentManager,
  environmentName: string | undefined
): Promise<void> {
  let toastId = '';
  try {
    if (!environmentName) {
      return;
    }
    const body = document.createElement('div');
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Name : ';
    const nameInput = document.createElement('input');
    body.appendChild(nameLabel);
    body.appendChild(nameInput);

    const response = await showDialog({
      title: 'Clone Environment',
      body: new Widget({ node: body }),
      buttons: [Dialog.cancelButton(), Dialog.okButton({ caption: 'Clone' })]
    });
    if (response.button.accept) {
      if (nameInput.value.length === 0) {
        throw new Error('An environment name should be provided.');
      }
      toastId = Notification.emit(
        `Cloning environment ${environmentName}`,
        'in-progress'
      );
      await model.clone(environmentName, nameInput.value);
      Notification.update({
        id: toastId,
        message: `Environment ${nameInput.value} created.`,
        type: 'success',
        autoClose: 5000
      });
    }
  } catch (error) {
    if (error !== 'cancelled') {
      console.error(error);
      if (toastId) {
        Notification.update({
          id: toastId,
          message: (error as any).message,
          type: 'error',
          autoClose: false
        });
      } else {
        Notification.error((error as any).message);
      }
    } else {
      if (toastId) {
        Notification.dismiss(toastId);
      }
    }
  }
}

export async function exportEnvironment(
  model: IEnvironmentManager,
  environmentName: string | undefined
): Promise<void> {
  try {
    if (!environmentName) {
      return;
    }
    const response = await model.export(environmentName);
    if (response.ok) {
      const content = await response.text();
      const node = document.createElement('div');
      const link = document.createElement('a');
      link.setAttribute(
        'href',
        'data:text/plain;charset=utf-8,' + encodeURIComponent(content)
      );
      link.setAttribute('download', environmentName + '.yml');

      node.style.display = 'none'; // hide the element
      node.appendChild(link);
      document.body.appendChild(node);
      link.click();
      document.body.removeChild(node);
    }
  } catch (error) {
    if (error !== 'cancelled') {
      console.error(error);
      Notification.error((error as any).message);
    }
  }
}

export async function removeEnvironment(
  model: IEnvironmentManager,
  environmentName: string
): Promise<void> {
  let toastId = '';
  try {
    if (!environmentName) {
      return;
    }
    const response = await showDialog({
      title: 'Remove Environment',
      body: `Are you sure you want to permanently delete environment "${environmentName}" ?`,
      buttons: [
        Dialog.cancelButton(),
        Dialog.okButton({
          caption: 'Delete',
          displayType: 'warn'
        })
      ]
    });
    if (response.button.accept) {
      toastId = Notification.emit(
        `Removing environment ${environmentName}`,
        'in-progress'
      );
      await model.remove(environmentName);
      Notification.update({
        id: toastId,
        message: `Environment ${environmentName} has been removed.`,
        type: 'success',
        autoClose: 5000
      });
    }
  } catch (error) {
    if (error !== 'cancelled') {
      console.error(error);
      if (toastId) {
        Notification.update({
          id: toastId,
          message: (error as any).message,
          type: 'error',
          autoClose: false
        });
      } else {
        Notification.error((error as any).message);
      }
    } else {
      if (toastId) {
        Notification.dismiss(toastId);
      }
    }
  }
}

async function _readFileAsText(file: Blob): Promise<string> {
  // Prefer the built-in Promise API when available
  if ((file as any).text) {
    return (file as any as File).text();
  }
  // Fallback for older environments
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsText(file);
  });
}

export async function importEnvironment(
  model: IEnvironmentManager,
  environmentName: string
): Promise<void> {
  let toastId = '';
  try {
    const body = document.createElement('div');
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Name : ';
    const nameInput = document.createElement('input');
    body.appendChild(nameLabel);
    body.appendChild(nameInput);

    const fileLabel = document.createElement('label');
    fileLabel.textContent = 'File : ';
    const fileInput = document.createElement('input');
    fileInput.setAttribute('type', 'file');

    body.appendChild(fileLabel);
    body.appendChild(fileInput);

    const response = await showDialog({
      title: 'Import Environment',
      body: new Widget({ node: body }),
      buttons: [Dialog.cancelButton(), Dialog.okButton()]
    });
    if (response.button.accept) {
      if (nameInput.value.length === 0) {
        throw new Error('A environment name should be provided.');
      }
      if ((fileInput.files?.length ?? 0) === 0) {
        throw new Error('A environment file should be selected.');
      }
      toastId = Notification.emit(
        `Import environment ${nameInput.value}`,
        'in-progress'
      );
      const selectedFile = fileInput.files![0];
      const file = await _readFileAsText(selectedFile);
      await model.import(nameInput.value, file, selectedFile.name);
      Notification.update({
        id: toastId,
        message: `Environment ${nameInput.value} created.`,
        type: 'success',
        autoClose: 5000
      });
    }
  } catch (error) {
    if (error !== 'cancelled') {
      console.error(error);
      if (toastId) {
        Notification.update({
          id: toastId,
          message: (error as any).message,
          type: 'error',
          autoClose: false
        });
      } else {
        Notification.error((error as any).message);
      }
    } else {
      if (toastId) {
        Notification.dismiss(toastId);
      }
    }
  }
}
