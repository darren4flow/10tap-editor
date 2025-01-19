import { FlatList, StyleSheet, Platform, View } from 'react-native';
import { useBridgeState } from '../useBridgeState';
import React from 'react';
import {
  DEFAULT_TOOLBAR_ITEMS,
  HEADING_ITEMS,
  type ToolbarItem,
} from './actions';
import { EditLinkBar } from './EditLinkBar';
import { useKeyboard } from '../../utils';
import type { EditorBridge } from '../../types';
import { ToolbarItemComp } from './ToolbarItemComp';
import { WebToolbar } from './WebToolbar';

interface ToolbarProps {
  editor: EditorBridge;
  hidden?: boolean;
  items?: ToolbarItem[];
}

export const toolbarStyles = StyleSheet.create({
  toolbarContainer: {
    flexDirection: 'row',
  },
  toolbarFlatList: {
    minWidth: '85%',
    maxWidth: '85%',
  },
  toolbarCloseKeyboard: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: '15%',
    maxWidth: '15%',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderLeftWidth: 0.5,
    borderColor: '#DEE0E3',
  },
});

export enum ToolbarContext {
  Main,
  Link,
  Heading,
}

export function Toolbar({
  editor,
  hidden = undefined,
  items = DEFAULT_TOOLBAR_ITEMS,
}: ToolbarProps) {
  const editorState = useBridgeState(editor);
  const { isKeyboardUp } = useKeyboard();
  const [toolbarContext, setToolbarContext] = React.useState<ToolbarContext>(
    ToolbarContext.Main
  );

  const hideToolbar =
    hidden === undefined ? !isKeyboardUp || !editorState.isFocused : hidden;

  const args = {
    editor,
    editorState,
    setToolbarContext,
    toolbarContext,
  };

  switch (toolbarContext) {
    case ToolbarContext.Main:
    case ToolbarContext.Heading:
      if (Platform.OS === 'web') {
        return (
          <WebToolbar
            items={
              toolbarContext === ToolbarContext.Main
                ? items.slice(1)
                : HEADING_ITEMS
            }
            args={args}
            editor={editor}
            hidden={hidden}
          />
        );
      }
      return (
        <View style={toolbarStyles.toolbarContainer}>
          <FlatList
            data={
              toolbarContext === ToolbarContext.Main
                ? items.slice(1)
                : HEADING_ITEMS
            }
            style={[
              editor.theme.toolbar.toolbarBody,
              hideToolbar ? editor.theme.toolbar.hidden : undefined,
              toolbarStyles.toolbarFlatList,
            ]}
            renderItem={({ item }) => {
              return <ToolbarItemComp {...item} args={args} editor={editor} />;
            }}
            horizontal
          />
          {items[0] && (
            <View
              style={[
                toolbarStyles.toolbarCloseKeyboard,
                hideToolbar ? editor.theme.toolbar.hidden : undefined,
              ]}
            >
              <ToolbarItemComp {...items[0]} args={args} editor={editor} />
            </View>
          )}
        </View>
      );
    case ToolbarContext.Link:
      return (
        <EditLinkBar
          theme={editor.theme}
          initialLink={editorState.activeLink}
          onBlur={() => {
            if (Platform.OS === 'web') {
              // On web blur is called before onEditLink. This isn't an ideal fix however this is going to be change soon when we
              // add the new api for toolbar where we will have more control. This is a temporary fix for now.
              setTimeout(() => {
                setToolbarContext(ToolbarContext.Main);
              }, 100);
            } else {
              setToolbarContext(ToolbarContext.Main);
            }
          }}
          onLinkIconClick={() => {
            setToolbarContext(ToolbarContext.Main);
            editor.focus();
          }}
          onEditLink={(link) => {
            editor.setLink(link);
            editor.focus();

            if (Platform.OS === 'android') {
              // On android we dont want to hide the link input before we finished focus on editor
              // Add here 100ms and we can try to find better solution later
              setTimeout(() => {
                setToolbarContext(ToolbarContext.Main);
              }, 100);
            } else {
              setToolbarContext(ToolbarContext.Main);
            }
          }}
        />
      );
  }
}
