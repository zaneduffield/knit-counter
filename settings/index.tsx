import {
  ProjectSettings,
  defaultProject,
  EditPageState,
  MainPageState,
  AddPageState,
  DeletePageState,
  ReorderPageState,
  SettingsPageState,
  SettingsPage,
  encodeSettingsState,
  decodeSettingsState,
  SettingsState,
  ProjectConfig,
} from "../common/settingsTypes";
import {
  TypedSettingProps,
  ASIS,
  SettingsComponentProps,
} from "fitbit-settings-commons";

function defaultSettingsState(): SettingsState {
  return {
    currentPage: SettingsPage.Main,
    mainPageState: new MainPageState(),
  };
}

function cancelButton(
  typedSetting: TypedSettingProps<ProjectSettings>
): JSX.Element {
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
  typedSetting: TypedSettingProps<ProjectSettings>
): JSX.Element {
  console.log(
    `rendering main page: ${Array(...typedSetting.get().projects.entries())}`
  );
  console.log(
    `rendering main page n items: ${typedSetting.get().projects.size}`
  );
  return (
    <Page>
      <Section
        title={
          <Text bold align="center">
            Knit Counter Settings
          </Text>
        }
      />

      <Select
        title="Projects"
        label="Edit Project"
        selectViewTitle="Select project to edit"
        options={Array(...typedSetting.get().projects.values()).map((p) => ({
          ...p,
        }))}
        renderItem={(p) => <Text>{p.name}</Text>}
        onSelection={({ values }) => {
          let p = values[0];
          var editPageState = new EditPageState();
          editPageState.projId = p.id;
          editPageState.newProjectConfig = { ...p };
          typedSetting.update({
            settingsState: {
              currentPage: SettingsPage.Edit,
              editPageState: editPageState,
            },
          });
        }}
      />

      <Button
        label="Add Project"
        onClick={(e) => {
          var addPageState = new AddPageState();
          var nextId = typedSetting.get().nextId;
          addPageState.projId = nextId;
          typedSetting.update({ nextId: nextId + 1 });
          addPageState.newProjectConfig = {
            id: nextId,
            name: "New Project",
            repeatLength: 10,
          };
          typedSetting.update({
            settingsState: {
              currentPage: SettingsPage.Add,
              addPageState: addPageState,
            },
          });
          console.log("added new project and switched settings state to it");
        }}
      />
    </Page>
  );
}

function renderAddPage(
  typedSetting: TypedSettingProps<ProjectSettings>
): JSX.Element {
  console.log("rendering add page");
  var pageState = typedSetting.get().settingsState.addPageState;
  return (
    <Page>
      <Section title={<Text>Add Project</Text>}>
        {projectNameInput(pageState, typedSetting)}
        {repeatLengthInput(pageState, typedSetting)}
        {cancelButton(typedSetting)}
        {saveNewProject(typedSetting, pageState)}
      </Section>
    </Page>
  );
}

function repeatLengthInput(
  pageState: AddPageState,
  typedSetting: TypedSettingProps<ProjectSettings>
) {
  return (
    <TextInput
      label="Repeat Length"
      value={`${pageState.newProjectConfig.repeatLength}`}
      onChange={(v) => {
        console;
        typedSetting.getToUpdate().projects.get(pageState.projId).repeatLength =
          parseInt(
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
  pageState: AddPageState | EditPageState,
  typedSetting: TypedSettingProps<ProjectSettings>
) {
  return (
    <TextInput
      label="Project Name"
      value={pageState.newProjectConfig.name}
      onChange={(v) => {
        console.log(`new project name: ${JSON.stringify(v)}`);
        // @ts-ignore; I don't know why the value passed here is actually an Object and not a string.
        var value = v.name;
        var pageState = typedSetting.getToUpdate().settingsState.addPageState;
        pageState.newProjectConfig.name = value;
        typedSetting.commit();
      }}
    />
  );
}

function saveNewProject(
  typedSetting: TypedSettingProps<ProjectSettings>,
  pageState: AddPageState
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
  typedSetting: TypedSettingProps<ProjectSettings>,
  pageState: EditPageState
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
  typedSetting: TypedSettingProps<ProjectSettings>
): JSX.Element {
  console.log("rendering edit page");
  var pageState = typedSetting.get().settingsState.editPageState;
  return (
    <Page>
      <Section title={<Text>Edit Project</Text>}>
        {projectNameInput(pageState, typedSetting)}
        {repeatLengthInput(pageState, typedSetting)}
        {cancelButton(typedSetting)}
        {saveProjectEdit(typedSetting, pageState)}
        <Button
          label="Delete Project"
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
  typedSetting: TypedSettingProps<ProjectSettings>
): JSX.Element {
  console.log("rendering delete page");
  var pageState = typedSetting.get().settingsState.deletePageState;
  var name = typedSetting.get().projects.get(pageState.projId).name;
  return (
    <Page>
      <Section title={<Text>Delete Project {name}</Text>}>
        <Text>This cannot be reversed</Text>
        <Button
          label="Delete"
          onClick={(e) => {
            typedSetting.getToUpdate().projects.delete(pageState.projId);
            typedSetting.getToUpdate().settingsState.currentPage =
              SettingsPage.Main;
            typedSetting.commit();
          }}
        />
      </Section>
    </Page>
  );
}
function renderReorderPage(
  typedSetting: TypedSettingProps<ProjectSettings>
): JSX.Element {
  return (
    <Page>
      <Text>TODO</Text>
    </Page>
  );
}

function renderSettingsPage(props: SettingsComponentProps): JSX.Element {
  const typedSetting: TypedSettingProps<ProjectSettings> =
    new TypedSettingProps(props, {
      projects: {
        packer: (v) => JSON.stringify(Array(...v.entries())),
        unpackInitiator: (v) =>
          new Map(v === undefined ? [defaultProject(0)] : JSON.parse(v)),
      },
      nextId: {
        unpackInitiator: (v) => (v === undefined ? 1 : JSON.parse(v)),
      },
      settingsState: {
        packer: (v) => encodeSettingsState(v),
        unpackInitiator: (v) =>
          v === undefined ? defaultSettingsState() : decodeSettingsState(v),
      },
    });

  var settingsState = typedSetting.get().settingsState;
  var pageType = settingsState.currentPage;
  typedSetting.get().projects.entries;

  if (pageType === SettingsPage.Main) {
    return renderMainPage(typedSetting);
  } else if (pageType === SettingsPage.Add) {
    return renderAddPage(typedSetting);
  } else if (pageType === SettingsPage.Edit) {
    return renderEditPage(typedSetting);
  } else if (pageType === SettingsPage.Delete) {
    return renderDeletePage(typedSetting);
  } else if (pageType === SettingsPage.Reorder) {
    return renderReorderPage(typedSetting);
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
