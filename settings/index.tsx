import {
  Settings,
  defaultProject,
  MainPageState,
  ProjectDetailsPageState,
  DeletePageState,
  ReorderPageState,
  SettingsPageState,
  SettingsPage,
  encodeSettingsState,
  decodeSettingsState,
  SettingsState,
  ProjectConfig,
  encodeProjectSettings,
  decodeProjectSettings,
  defaultSettingsState,
  DEFAULT_TIME_FORMAT,
  ResetPageState,
} from "../common/settingsTypes";
import {
  TypedSettingProps,
  ASIS,
  SettingsComponentProps,
} from "fitbit-settings-commons";
import { Operation } from "../common/messages";

function cancelButton(typedSetting: TypedSettingProps<Settings>): JSX.Element {
  return (
    <Button
      label="Cancel"
      onClick={(e) => {
        typedSetting.getToUpdate().settingsState.currentPage =
          SettingsPage.Main;
        typedSetting.commit();
      }}
    />
  );
}

function renderMainPage(
  typedSetting: TypedSettingProps<Settings>
): JSX.Element {
  return (
    <Page>
      <Section
        title={
          <Text bold align="center">
            Project Settings
          </Text>
        }
      >
        <Select
          title=""
          label="Edit Project"
          selectViewTitle="Select project to edit"
          options={Array(...typedSetting.get().projects.values()).map((p) => ({
            ...p,
          }))}
          renderItem={(p) => <Text>{p.name}</Text>}
          onSelection={({ values }) => {
            let p = values[0];
            var detailsState = new ProjectDetailsPageState();
            detailsState.projId = p.id;
            detailsState.newProjectConfig = { ...p };
            typedSetting.update({
              settingsState: {
                currentPage: SettingsPage.Edit,
                projectDetailsState: detailsState,
              },
            });
          }}
        />

        <Button
          label="Add Project"
          onClick={(e) => {
            var detailsState = new ProjectDetailsPageState();
            var nextId = typedSetting.get().nextId;
            detailsState.projId = nextId;
            typedSetting.update({ nextId: nextId + 1 });
            detailsState.newProjectConfig = {
              id: nextId,
              name: `Project ${nextId}`,
              repeatLength: 10,
            };
            typedSetting.update({
              settingsState: {
                currentPage: SettingsPage.Add,
                projectDetailsState: detailsState,
              },
            });
            console.log("added new project and switched settings state to it");
          }}
        />
      </Section>

      {renderTimeSettings(typedSetting)}
    </Page>
  );
}

function renderTimeSettings(
  typedSetting: TypedSettingProps<Settings>
): JSX.Element {
  var secondaryTimeSettings: JSX.Element[] = [];
  if (typedSetting.get().timeFormat.showTime) {
    secondaryTimeSettings.push(
      <Toggle
        label="Show Seconds"
        /* @ts-ignore the TS typing package is a little outdated */
        value={typedSetting.get().timeFormat.showSeconds}
        onChange={(v) => {
          typedSetting.getToUpdate().timeFormat.showSeconds = v;
          typedSetting.commit();
        }}
      />
    );
    secondaryTimeSettings.push(
      <Toggle
        label="Use 24-hour Time"
        /* @ts-ignore the TS typing package is a little outdated */
        value={typedSetting.get().timeFormat.is24hourTime}
        onChange={(v) => {
          typedSetting.getToUpdate().timeFormat.is24hourTime = v;
          typedSetting.commit();
        }}
      />
    );
  }

  return (
    <Section
      title={
        <Text bold align="center">
          Clock Settings
        </Text>
      }
    >
      <Toggle
        label="Show Time"
        /* @ts-ignore the TS typing package is a little outdated */
        value={typedSetting.get().timeFormat.showTime}
        onChange={(v) => {
          typedSetting.getToUpdate().timeFormat.showTime = v;
          typedSetting.commit();
        }}
      />
      {secondaryTimeSettings}
    </Section>
  );
}

function renderAddPage(typedSetting: TypedSettingProps<Settings>): JSX.Element {
  console.log("rendering add page");
  var pageState = typedSetting.get().settingsState.projectDetailsState;
  return (
    <Page>
      <Section title={<Text>Add Project</Text>}>
        {projectNameInput(pageState, typedSetting)}
        {repeatLengthInput(pageState, typedSetting)}
        {saveNewProject(typedSetting, pageState)}
        {cancelButton(typedSetting)}
      </Section>
    </Page>
  );
}

function repeatLengthInput(
  pageState: ProjectDetailsPageState,
  typedSetting: TypedSettingProps<Settings>
) {
  return (
    <TextInput
      label="Repeat Length"
      value={`${pageState.newProjectConfig.repeatLength}`}
      onChange={(v) => {
        var newState =
          typedSetting.getToUpdate().settingsState.projectDetailsState;
        newState.newProjectConfig.repeatLength = parseInt(
          // @ts-ignore; I don't know why the value passed here is actually an Object and not a string.
          v.name
        );
        typedSetting.commit();
      }}
      type="number"
    />
  );
}

function projectNameInput(
  pageState: ProjectDetailsPageState,
  typedSetting: TypedSettingProps<Settings>
) {
  return (
    <TextInput
      label="Project Name"
      value={pageState.newProjectConfig.name}
      onChange={(v) => {
        console.log(`new project name: ${JSON.stringify(v)}`);
        // @ts-ignore; I don't know why the value passed here is actually an Object and not a string.
        var value = v.name;
        var newPageState =
          typedSetting.getToUpdate().settingsState.projectDetailsState;
        newPageState.newProjectConfig.name = value;
        typedSetting.commit();
      }}
    />
  );
}

function saveNewProject(
  typedSetting: TypedSettingProps<Settings>,
  pageState: ProjectDetailsPageState
) {
  console.log(`saving new project with id ${pageState.projId}`);
  return (
    <Button
      label="Save"
      onClick={(e) => {
        typedSetting
          .getToUpdate()
          .projects.set(pageState.projId, pageState.newProjectConfig);
        typedSetting.getToUpdate().settingsState.currentPage =
          SettingsPage.Main;
        typedSetting.commit();
      }}
    />
  );
}

function saveProjectEdit(
  typedSetting: TypedSettingProps<Settings>,
  pageState: ProjectDetailsPageState
) {
  return (
    <Button
      label="Save"
      onClick={(e) => {
        typedSetting
          .getToUpdate()
          .projects.set(pageState.projId, pageState.newProjectConfig);
        typedSetting.getToUpdate().settingsState.currentPage =
          SettingsPage.Main;
        typedSetting.commit();
      }}
    />
  );
}

function renderEditPage(
  typedSetting: TypedSettingProps<Settings>
): JSX.Element {
  console.log("rendering edit page");
  var pageState = typedSetting.get().settingsState.projectDetailsState;
  return (
    <Page>
      <Section title={<Text>Edit Project</Text>}>
        {projectNameInput(pageState, typedSetting)}
        {repeatLengthInput(pageState, typedSetting)}
        {saveProjectEdit(typedSetting, pageState)}
        {cancelButton(typedSetting)}
      </Section>
      <Section title={<Text>Reset Project Counter</Text>}>
        <Button
          label="Reset"
          onClick={(e) => {
            typedSetting.getToUpdate().settingsState.currentPage =
              SettingsPage.Reset;
            var newState = new ResetPageState();
            newState.projId = pageState.projId;
            typedSetting.getToUpdate().settingsState.resetPageState = newState;
            typedSetting.commit();
          }}
        />
      </Section>

      <Section title={<Text>Delete Project</Text>}>
        <Button
          label="Delete"
          onClick={(e) => {
            typedSetting.getToUpdate().settingsState.currentPage =
              SettingsPage.Delete;
            var deleteState = new DeletePageState();
            deleteState.projId = pageState.projId;
            typedSetting.getToUpdate().settingsState.deletePageState =
              deleteState;
            typedSetting.commit();
          }}
        />
      </Section>
    </Page>
  );
}

function renderDeletePage(
  typedSetting: TypedSettingProps<Settings>
): JSX.Element {
  console.log("rendering delete page");
  var pageState = typedSetting.get().settingsState.deletePageState;
  var name = typedSetting.get().projects.get(pageState.projId).name;
  return (
    <Page>
      <Section title={<Text>Delete Project {name}</Text>}>
        <Text>This cannot be undone</Text>
        <Button
          label="Delete"
          onClick={(e) => {
            typedSetting.getToUpdate().projects.delete(pageState.projId);
            typedSetting.getToUpdate().settingsState.currentPage =
              SettingsPage.Main;
            typedSetting.commit();
          }}
        />
        <Button
          label="Cancel"
          onClick={(e) => {
            typedSetting.getToUpdate().settingsState.currentPage =
              SettingsPage.Edit;
            typedSetting.commit();
          }}
        />
      </Section>
    </Page>
  );
}

function renderResetPage(
  typedSetting: TypedSettingProps<Settings>
): JSX.Element {
  console.log("rendering reset page");
  var pageState = typedSetting.get().settingsState.resetPageState;
  var name = typedSetting.get().projects.get(pageState.projId).name;
  return (
    <Page>
      <Section title={<Text>Reset Project {name}</Text>}>
        <Text>
          This will reset all counters in this project to zero; it cannot be
          undone.
        </Text>
        <Text>It will only work if the watch is connected to this device.</Text>
        <Button
          label="Reset"
          onClick={(e) => {
            typedSetting.update({
              projectOperation: {
                projId: pageState.projId,
                operation: Operation.ResetCounters,
              },
            });
            typedSetting.getToUpdate().settingsState.currentPage =
              SettingsPage.Main;
            typedSetting.commit();
            typedSetting.update({ projectOperation: undefined });
          }}
        />
        <Button
          label="Cancel"
          onClick={(e) => {
            typedSetting.getToUpdate().settingsState.currentPage =
              SettingsPage.Edit;
            typedSetting.commit();
          }}
        />
      </Section>
    </Page>
  );
}

function renderSettingsPage(props: SettingsComponentProps): JSX.Element {
  const typedSetting: TypedSettingProps<Settings> = new TypedSettingProps(
    props,
    {
      projects: {
        packer: (v) => encodeProjectSettings(v),
        unpackInitiator: (v) => decodeProjectSettings(v),
      },
      nextId: {
        unpackInitiator: (v) => (v === undefined ? 1 : JSON.parse(v)),
      },
      settingsState: {
        packer: (v) => encodeSettingsState(v),
        unpackInitiator: (v) => decodeSettingsState(v),
      },
      timeFormat: {
        unpackInitiator: (v) =>
          v === undefined ? DEFAULT_TIME_FORMAT : JSON.parse(v),
      },
    }
  );

  var settingsState = typedSetting.get().settingsState;
  var pageType = settingsState.currentPage;
  typedSetting.get().projects.entries;

  if (pageType === SettingsPage.Main) {
    return renderMainPage(typedSetting);
  } else if (pageType === SettingsPage.Add) {
    return renderAddPage(typedSetting);
  } else if (pageType === SettingsPage.Edit) {
    return renderEditPage(typedSetting);
  } else if (pageType === SettingsPage.Reset) {
    return renderResetPage(typedSetting);
  } else if (pageType === SettingsPage.Delete) {
    return renderDeletePage(typedSetting);
  } else {
    typedSetting.update({
      settingsState: { pageState: defaultSettingsState() },
    });
    console.error(
      `couldn't find page to render: current page class is ${settingsState.constructor.name}`
    );
    return (
      <Page>
        <Text>Internal Error</Text>
      </Page>
    );
  }
}

registerSettingsPage(renderSettingsPage);
