// components/EditAccountModal.jsx
import { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import apiClient from "../utils/apiClient";
import { useAuth } from "../contexts/AuthContext";

const EditAccountModal = ({ account, onClose, onReload }) => {
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "user",
    status: true,
  });
  const [loading, setLoading] = useState(false);
  const { refreshUserRole, user } = useAuth();

  useEffect(() => {
    if (account) {
      setForm({
        email: account.email || "",
        first_name: account.first_name || "",
        last_name: account.last_name || "",
        role: account.role || "user",
        status: account.status !== undefined ? account.status : true,
      });
    }
  }, [account]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convert status string to boolean
    if (name === "status") {
      setForm({ ...form, [name]: value === "true" });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSave = async () => {
    console.log("Save button clicked");
    console.log("Saving data:", form);

    setLoading(true);
    try {
      const response = await apiClient.put(`/accounts/${account.id}`, form);

      console.log("Update response:", response.data);
      
      // If the edited account is the current logged-in user, refresh their role
      if (user && user.id === account.id) {
        await refreshUserRole();
      }
      
      onReload();
      onClose();
    } catch (error) {
      console.error("Error updating account:", error);
      alert("Failed to update account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={!!account} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Account</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              type="text"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              type="text"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Role <span className="text-danger">*</span></Form.Label>
            <Form.Select
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </Form.Select>
            <Form.Text className="text-muted">
              <strong>User:</strong> Can access Dashboard and Maps.<br/>
              <strong>Admin:</strong> Full access including user management and alerts.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Status <span className="text-danger">*</span></Form.Label>
            <Form.Select
              name="status"
              value={form.status.toString()}
              onChange={handleChange}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Form.Select>
            <Form.Text className="text-muted">
              <strong>Active:</strong> User can log in and access the system.<br/>
              <strong>Inactive:</strong> User account is disabled.
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditAccountModal;