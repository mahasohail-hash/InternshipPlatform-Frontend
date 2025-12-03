'use client';
import React, { useState, useEffect } from "react";
import MainLayout from "../../components/MainLayout";
import {
Typography,
Button,
Modal,
Form,
Input,
Table,
Space,
notification,
Popconfirm,
Spin,
List,
Tag,
Select,
Empty,
} from "antd";
import {
PlusOutlined,
EditOutlined,
DeleteOutlined,
PlusCircleOutlined,
DeleteFilled,
} from "@ant-design/icons";
import api from "../../../lib/api";
import { isAxiosError } from "axios";
import { useForm, Controller, useFieldArray } from "react-hook-form";

const { Title, Text } = Typography;
const { Option } = Select;

// --- TypeScript Interfaces ---
interface ChecklistTemplateItem {
id?: string;
title: string;
text: string;
}

interface ChecklistTemplate {
id: string;
name: string;
description: string;
items: ChecklistTemplateItem[];
}

interface TemplateFormData {
name: string;
description: string;
items: ChecklistTemplateItem[];
}

interface Intern {
id: string;
name: string;
email: string;
}

interface AssignedChecklist {
items: never[];
id: string;
template: { id: string; name: string };
isCompleted: boolean;
}

// --- Reusable Template Form Component ---
const TemplateForm = ({
control,
errors,
fields,
append,
remove,
}: {
control: any;
errors: any;
fields: any[];
append: any;
remove: any;
}) => {
return (
<>
<Form.Item
label="Template Name"
required
validateStatus={errors.name ? "error" : ""}
help={errors.name?.message}
>
<Controller
name="name"
control={control}
rules={{ required: "Template Name is required" }}
render={({ field }) => (
<Input {...field} placeholder="e.g., Week 1 Onboarding" />
)}
/>
</Form.Item>
<Form.Item
label="Description"
validateStatus={errors.description ? "error" : ""}
help={errors.description?.message}
>
<Controller
name="description"
control={control}
render={({ field }) => <Input.TextArea {...field} rows={2} />}
/>
</Form.Item>
<Title level={5} style={{ marginTop: 20 }}>
Checklist Items </Title>
<List
locale={{ emptyText: "No items added yet." }}
dataSource={fields}
renderItem={(field, index) => (
<List.Item
key={field.id}
actions={[
<Button
type="text"
danger
icon={<DeleteFilled />}
onClick={() => remove(index)}
/>,
]}
>
<Space direction="vertical" style={{ width: "100%" }}>
<Form.Item
label={`Item ${index + 1}: Title`}
required
validateStatus={errors.items?.[index]?.title ? "error" : ""}
help={errors.items?.[index]?.title?.message}
>
<Controller
name={`items.${index}.title`}
control={control}
rules={{ required: "Item title is required" }}
render={({ field }) => <Input {...field} />}
/>
</Form.Item>
<Form.Item
label={`Item ${index + 1}: Text/Description`}
required
validateStatus={errors.items?.[index]?.text ? "error" : ""}
help={errors.items?.[index]?.text?.message}
>
<Controller
name={`items.${index}.text`}
control={control}
rules={{ required: "Item text/description is required" }}
render={({ field }) => <Input.TextArea {...field} rows={2} />}
/>
</Form.Item> </Space>
</List.Item>
)}
/>
<Button
type="dashed"
onClick={() => append({ title: "", text: "" })}
icon={<PlusCircleOutlined />}
style={{ marginTop: 16, width: "100%" }}
>
Add Checklist Item </Button>
</>
);
};

// --- Main Page Component ---
export default function ChecklistTemplatesPage() {
const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
const [interns, setInterns] = useState<Intern[]>([]);
const [loading, setLoading] = useState(true);
const [templateModalOpen, setTemplateModalOpen] = useState(false);
const [assignModalOpen, setAssignModalOpen] = useState(false);
const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);
const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
const [selectedInterns, setSelectedInterns] = useState<string[]>([]);
const [assignedChecklists, setAssignedChecklists] = useState<Record<string, AssignedChecklist[]>>({});

const {
control,
handleSubmit,
reset,
formState: { errors },
} = useForm<TemplateFormData>({
defaultValues: { name: "", description: "", items: [] },
});

const { fields, append, remove, replace } = useFieldArray({
control,
name: "items",
});

// --- Fetch Templates & Interns ---
const fetchData = async () => {
setLoading(true);
try {
const [templatesRes, internsRes] = await Promise.all([
  api.get("/checklists/templates"),
  api.get("/users?role=INTERN"),
]);
setTemplates(templatesRes.data || []);
setInterns(internsRes.data || []);

} catch (error) {
console.error("Fetch data error:", error);
notification.error({
message: "Failed to load data",
description: isAxiosError(error)
? error.response?.data?.message || error.message
: "Unknown error",
});
} finally {
setLoading(false);
}
};

useEffect(() => {
fetchData();
}, []);

// --- Template Modal ---
const handleShowTemplateModal = (template: ChecklistTemplate | null = null) => {
if (template) {
setEditingTemplate(template);
const formItems = template.items?.map((item) => ({
id: item.id,
title: item.title || "",
text: item.text || "",
})) || [];
reset({ name: template.name, description: template.description, items: formItems });
replace(formItems);
} else {
setEditingTemplate(null);
reset({ name: "", description: "", items: [{ title: "", text: "" }] });
replace([{ title: "", text: "" }]);
}
setTemplateModalOpen(true);
};

const handleCancelTemplateModal = () => {
setTemplateModalOpen(false);
setEditingTemplate(null);
reset();
replace([]);
};

const onSubmitTemplate = async (data: TemplateFormData) => {
setIsSubmitting(true);
try {
const payload = {
name: data.name,
description: data.description,
items: data.items.map((i) => ({ id: i.id, title: i.title, text: i.text })),
};
if (editingTemplate) {
  await api.patch(`/checklists/templates/${editingTemplate.id}`, payload);
} else {
  await api.post("/checklists/templates", payload);
}

notification.success({ message: editingTemplate ? "Template updated!" : "Template created!" });
fetchData();
handleCancelTemplateModal();
} catch (error) {
console.error("Submit template error:", error);
notification.error({ message: "Operation failed" });
} finally {
setIsSubmitting(false);
}
};

const handleDeleteTemplate = async (id: string) => {
try {
await api.delete(`/checklists/templates/${id}`);
notification.success({ message: "Template deleted successfully" });
fetchData();
} catch (error) {
console.error("Delete template error:", error);
notification.error({ message: "Failed to delete template" });
}
};

// --- Assign Modal ---
const handleAssignModalOpen = () => setAssignModalOpen(true);
const handleAssignModalClose = () => {
setAssignModalOpen(false);
setSelectedTemplate(null);
setSelectedInterns([]);
setAssignedChecklists({});
};

const handleInternChange = async (values: string[]) => {
setSelectedInterns(values);
const records: Record<string, AssignedChecklist[]> = {};
await Promise.all(
values.map(async (id) => {
try {
const res = await api.get(`/checklists/intern/${id}`);
records[id] = res.data || [];
} catch (error) {
console.error(`Fetch assigned checklists error for intern ${id}:`, error);
records[id] = [];
}
})
);
setAssignedChecklists(records);
};

const handleAssign = async () => {
if (!selectedTemplate || selectedInterns.length === 0) {
notification.warning({ message: "Please select a template and at least one intern" });
return;
}
try {
await api.post("/checklists/assign-multiple", {
templateIds: [selectedTemplate],
internIds: selectedInterns,
});
    window.dispatchEvent(new Event('refreshChecklists'));


  // Refresh assigned checklists immediately
  await handleInternChange(selectedInterns);

  notification.success({ message: "Checklist assigned successfully" });
  handleAssignModalClose();
} catch (error) {
  console.error("Assignment error:", error);
  notification.error({
    message: "Assignment failed",
    description: isAxiosError(error)
      ? error.response?.data?.message || "Unknown error"
      : "Network error",
  });
}


};

const disabledInternIds = selectedTemplate
? interns
.filter((i) => (assignedChecklists[i.id] || []).some((a) => a.template.id === selectedTemplate))
.map((i) => i.id)
: [];

// --- Table Columns ---
const templateColumns = [
{
title: "Name",
dataIndex: "name",
key: "name",
render: (name: string) => <strong>{name}</strong>,
},
{
title: "Description",
dataIndex: "description",
key: "description",
ellipsis: true,
},
{
title: "Items",
dataIndex: "items",
key: "items",
render: (items: ChecklistTemplateItem[]) => items?.length || 0,
align: "center",
},
{
title: "Actions",
key: "actions",
render: (_: any, record: ChecklistTemplate) => ( <Space>
<Button onClick={() => handleShowTemplateModal(record)} icon={<EditOutlined />}>
Edit </Button>
<Popconfirm
title="Are you sure you want to delete this template?"
onConfirm={() => handleDeleteTemplate(record.id)}
>
<Button danger icon={<DeleteOutlined />}>Delete</Button> </Popconfirm> </Space>
),
},
];

if (loading) return <Spin tip="Loading..." style={{ marginTop: 50 }} />;

return ( <MainLayout>
<Space direction="vertical" style={{ width: "100%" }} size="large"> <Title level={2}>Checklist Templates</Title>
<Button type="primary" icon={<PlusOutlined />} onClick={() => handleShowTemplateModal(null)}>
Create Template </Button> <Button type="default" onClick={handleAssignModalOpen}>
Assign Checklist to Interns </Button>
<Table
columns={templateColumns}
dataSource={templates}
rowKey="id"
locale={{ emptyText: "No templates found" }}
/>


    {/* Template Modal */}
    <Modal
      title={editingTemplate ? `Edit ${editingTemplate.name}` : "Create Template"}
      open={templateModalOpen}
      footer={null}
      width={800}
      onCancel={handleCancelTemplateModal}
    >
      <Form layout="vertical" onFinish={handleSubmit(onSubmitTemplate)}>
        <TemplateForm
          control={control}
          errors={errors}
          fields={fields}
          append={append}
          remove={remove}
        />
        <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: 24 }}>
          <Button onClick={handleCancelTemplateModal}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            {editingTemplate ? "Update" : "Save"}
          </Button>
        </Space>
      </Form>
    </Modal>

    {/* Assign Modal with Improved Progress */}
    <Modal
title="Assign Checklist"
open={assignModalOpen}
onCancel={handleAssignModalClose}
onOk={handleAssign}
width={1000}

>

{templates.length === 0 || interns.length === 0 ? ( <Empty />
) : (
<>
<Form layout="vertical" style={{ marginBottom: 16 }}>
<Form.Item label="Select Template">
<Select
value={selectedTemplate}
onChange={async (v) => {
setSelectedTemplate(v);
setSelectedInterns([]);
const records: Record<string, AssignedChecklist[]> = {};
await Promise.all(
interns.map(async (i) => {
try {
const res = await api.get(`/checklists/intern/${i.id}`);
records[i.id] = res.data || [];
} catch (error) {
console.error(`Fetch assigned checklists error for intern ${i.id}:`, error);
records[i.id] = [];
}
})
);
setAssignedChecklists(records);
}}
placeholder="Select a template"
>
{templates.map((t) => ( <Option key={t.id} value={t.id}>{t.name}</Option>
))} </Select>
</Form.Item>

```
    <Form.Item label="Select Interns">
      <Select
        mode="multiple"
        value={selectedInterns}
        onChange={handleInternChange}
        placeholder="Select interns"
      >
        {interns.map((i) => {
          const alreadyAssigned = selectedTemplate
            ? (assignedChecklists[i.id] || []).some(
                (a) => a.template.id === selectedTemplate
              )
            : false;
          return (
            <Option key={i.id} value={i.id} disabled={alreadyAssigned}>
              {i.name} ({i.email}) {alreadyAssigned ? "(Already assigned)" : ""}
            </Option>
          );
        })}
      </Select>
    </Form.Item>
  </Form>

  {selectedInterns.length > 0 && (
    <Table
      rowKey="id"
      dataSource={selectedInterns.map((id) => {
        const intern = interns.find((i) => i.id === id);
        const assigned = assignedChecklists[id] || [];
        const percent = assigned.length
          ? Math.round((assigned.filter((a) => a.isCompleted).length / assigned.length) * 100)
          : 0;
        return { ...intern, assigned, percent };
      })}
      pagination={false}
      bordered
      scroll={{ x: 1000 }}
      expandable={{
        expandedRowRender: (record: any) => {
          return (
            <div style={{ paddingLeft: 24 }}>
              {record.assigned.length > 0 ? (
                record.assigned.map((checklist: AssignedChecklist) => (
                  <div key={checklist.id} style={{ marginBottom: 12 }}>
                    <Text strong>{checklist.template.name}</Text>
                    <List
                      size="small"
                      dataSource={checklist.items || []} // Assuming API returns items inside assigned checklist
                      renderItem={(item: any) => (
                        <List.Item>
                          {item.title}:{" "}
                          {item.isCompleted ? (
                            <Tag color="green">Completed</Tag>
                          ) : (
                            <Tag color="blue">In Progress</Tag>
                          )}
                        </List.Item>
                      )}
                    />
                  </div>
                ))
              ) : (
                <Text type="secondary">No checklists assigned</Text>
              )}
            </div>
          );
        },
      }}
      columns={[
        {
          title: "Intern",
          dataIndex: "name",
          key: "name",
          render: (_: any, record: any) => (
            <>
              <Text strong>{record.name}</Text> <br />
              <Text type="secondary">{record.email}</Text>
            </>
          ),
        },
        {
          title: "Assigned Checklists",
          dataIndex: "assigned",
          key: "assigned",
          render: (assigned: AssignedChecklist[]) =>
            assigned.length ? (
              <List
                size="small"
                dataSource={assigned}
                renderItem={(item) => (
                  <List.Item>
                    {item.template.name}{" "}
                    {item.isCompleted ? (
                      <Tag color="green">Completed</Tag>
                    ) : (
                      <Tag color="blue">In Progress</Tag>
                    )}
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">None</Text>
            ),
        },
        {
          title: "Progress",
          dataIndex: "percent",
          key: "percent",
          render: (percent: number) => (
            <div>
              <Text type="secondary">{percent}%</Text>
              <div
                style={{
                  height: 6,
                  width: "100%",
                  background: "#f0f0f0",
                  borderRadius: 3,
                  marginTop: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${percent}%`,
                    height: "100%",
                    background: percent === 100 ? "green" : "blue",
                  }}
                />
              </div>
            </div>
          ),
        },
      ]}
    />
  )}
</>


)} </Modal>

  </Space>
</MainLayout>


);
}
