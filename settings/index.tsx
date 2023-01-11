import {
  ProjectSettings,
  defaultProject,
  SettingsPage,
  EditPageState,
  MainPageState,
  AddPageState,
  DeletePageState,
  ReorderPageState,
  SettingsState,
} from "../common/settingsTypes";
import {
  TypedSettingProps,
  ASIS,
  SettingsComponentProps,
} from "fitbit-settings-commons";

function defaultSettingsState(): SettingsState {
  return {
    pageState: new MainPageState(),
  };
}

function renderMainPage(
  typedSetting: TypedSettingProps<ProjectSettings>
): JSX.Element {
  return (
    <Page>
      <Section
        title={
          <Text bold align="center">
            Knit Counter Settings
          </Text>
        }
      />
      {typedSetting.get().projects.map((p) => {
        <Button
          label={p.name}
          list={true}
          onClick={(e) => {
            var editPageState = new EditPageState();
            editPageState.projId = p.id;
            editPageState.newProjectConfig = { ...p };
            typedSetting.getToUpdate().settingsState.pageState = editPageState;
          }}
        />;
      })}
    </Page>
  );
}

function renderAddPage(
  typedSetting: TypedSettingProps<ProjectSettings>
): JSX.Element {}
function renderEditPage(
  typedSetting: TypedSettingProps<ProjectSettings>
): JSX.Element {}
function renderDeletePage(
  typedSetting: TypedSettingProps<ProjectSettings>
): JSX.Element {}
function renderReorderPage(
  typedSetting: TypedSettingProps<ProjectSettings>
): JSX.Element {}

function renderSettingsPage(props: SettingsComponentProps): JSX.Element {
  const typedSetting: TypedSettingProps<ProjectSettings> =
    new TypedSettingProps(props, {
      projects: {
        unpackInitiator: (v) =>
          v === undefined ? [defaultProject(0)] : JSON.parse(v),
      },
      nextId: {
        unpackInitiator: (v) => (v === undefined ? 1 : JSON.parse(v)),
      },
      settingsState: {
        unpackInitiator: (v) =>
          v === undefined ? defaultSettingsState() : JSON.parse(v),
      },
    });

  var curSettings = typedSetting.get();
  var curPage = typedSetting.get().settingsState.pageState;
  if (curPage instanceof MainPageState) {
    return renderMainPage(typedSetting);
  } else if (curPage instanceof AddPageState) {
    return renderAddPage(typedSetting);
  } else if (curPage instanceof EditPageState) {
    return renderEditPage(typedSetting);
  } else if (curPage instanceof DeletePageState) {
    return renderDeletePage(typedSetting);
  } else if (curPage instanceof ReorderPageState) {
    return renderReorderPage(typedSetting);
  } else {
    typedSetting.update({
      settingsState: { pageState: defaultSettingsState() },
    });
    return (
      <Page>
        <Text>Internal Error</Text>
      </Page>
    );
  }

  return (
    <Page>
      <Section
        title={
          <Text bold align="center">
            Global Settings
          </Text>
        }
      ></Section>

      {typedSetting.get().projects.map((project, i) => {
        console.log(`repeatLength: ${project.repeatLength}`);

        return (
          <Section
            title={
              <Text bold align="center">
                Project {i}
              </Text>
            }
          >
            <TextInput
              label="Repeat Length"
              value={`${project.repeatLength}`}
              onChange={(v) => {
                console;
                typedSetting.getToUpdate().projects[i].repeatLength = parseInt(
                  // @ts-ignore; I don't know why the value passed here is actually an Object and not a string.
                  v.name
                );
                typedSetting.commit();
              }}
              type="number"
            />
          </Section>
        );
      })}

      {/* <AdditiveList
        title="A list of TextImageRow"
        settingsKey="select-list"
        maxItems="5"
        renderItem={({ name, value }) => (
          <TextImageRow
            label={name}
            sublabel={value.location}
            icon={value.icon}
          />
        )}
        addAction={
          <Select
            label="Add Item"
            options={[
              {
                name: "Label1",
                required: true,
                value: {
                  location: "Sub-Label",
                  icon: "https://tinyurl.com/ybbmpxxq",
                },
              },
              {
                name: "Label2",
                value: {
                  location: "Sub-Label",
                  icon: "https://tinyurl.com/ybbmpxxq",
                },
              },
              {
                name: "Label3",
                required: true,
                value: {
                  location: "Sub-Label",
                  icon: "https://tinyurl.com/ybbmpxxq",
                },
              },
              {
                name: "Label4",
                value: {
                  location: "Sub-Label",
                  icon: "https://tinyurl.com/ybbmpxxq",
                },
              },
              {
                name: "Label5",
                required: false,
                value: {
                  location: "Sub-Label",
                  icon: "https://tinyurl.com/ybbmpxxq",
                },
              },
            ]}
          />
        }
      /> */}
    </Page>
  );
}

interface Person {
  name: string;
  address?: string;
  uuid: string;
}

function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function settingsComponent(
  props: Parameters<Parameters<typeof registerSettingsPage>[0]>[0]
) {
  const persons: Person[] = props.settings.persons
    ? JSON.parse(props.settings.persons)
    : [];
  console.log("Rendering, " + JSON.stringify(props.settings));
  if (props.settings.addPage === "true")
    return (
      <Page>
        <Section
          title={
            props.settings.curItem === undefined
              ? "Add a Person"
              : "Update Person"
          }
        >
          <TextInput label="Name" settingsKey="newPersonName"></TextInput>
          <TextInput label="Address" settingsKey="newPersonAddress"></TextInput>
          {props.settings.curItem === undefined
            ? [
                <Button
                  label="Add"
                  onClick={() => {
                    persons.push({
                      name: JSON.parse(props.settings.newPersonName)
                        .name as string,
                      address: JSON.parse(props.settings.newPersonAddress)
                        .name as string,
                      uuid: uuidv4(),
                    });
                    props.settingsStorage.setItem(
                      "persons",
                      JSON.stringify(persons)
                    );
                    props.settingsStorage.setItem("addPage", "false");
                  }}
                />,
                <Button
                  label="Cancel"
                  onClick={() => {
                    props.settingsStorage.setItem("addPage", "false");
                  }}
                />,
              ]
            : [
                <Button
                  label="Update"
                  onClick={() => {
                    const original: Person = persons.find(
                      (p) => p.uuid === props.settings.curItem
                    );
                    if (original) {
                      original.name = JSON.parse(props.settings.newPersonName)
                        .name as string;
                      original.address = JSON.parse(
                        props.settings.newPersonAddress
                      ).name as string;
                    }
                    props.settingsStorage.setItem(
                      "persons",
                      JSON.stringify(persons)
                    );
                    props.settingsStorage.setItem("addPage", "false");
                  }}
                />,
                <Button
                  label="Cancel"
                  onClick={() => {
                    props.settingsStorage.setItem("addPage", "false");
                  }}
                />,
              ]}
        </Section>
      </Page>
    );
  else
    return (
      <Page>
        <AdditiveList
          title="Person"
          description="Description of additive list"
          key="w"
          addAction={
            <Button
              label="Add Person"
              onClick={() => {
                props.settingsStorage.setItem("addPage", "true");
                props.settingsStorage.removeItem("curItem");
                props.settingsStorage.removeItem("newPersonName");
                props.settingsStorage.removeItem("newPersonAddress");
              }}
            />
          }
          settingsKey="persons"
          renderItem={({ name, address, uuid }) => (
            <Button
              label={name + "," + address}
              onClick={() => {
                props.settingsStorage.setItem("addPage", "true");
                props.settingsStorage.setItem("curItem", uuid);
                props.settingsStorage.setItem(
                  "newPersonName",
                  JSON.stringify({ name: name })
                );
                props.settingsStorage.setItem(
                  "newPersonAddress",
                  JSON.stringify({ name: address })
                );
              }}
            />
          )}
        />
      </Page>
    );
}

registerSettingsPage(renderSettingsPage);
