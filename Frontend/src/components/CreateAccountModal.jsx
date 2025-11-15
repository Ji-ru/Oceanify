// components/CreateAccountModal.jsx
import { useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import supabase from "../supabaseClient";
import apiClient from "../utils/apiClient"; // ✅ Added for logging

const CreateAccountModal = ({ show, onClose, onReload }) => {
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error for this field when user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!form.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }
    
    if (!form.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    
    try {
      // Create account using Supabase Auth (same as SignUp page)
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.first_name,
            last_name: form.last_name,
          },
        },
      });

      if (error) throw error;

      // ✅ Log the account creation activity
      try {
        await apiClient.post('/accounts', {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          role: 'user'
        });
        console.log('✅ Activity logged for account creation');
      } catch (logError) {
        console.error('Failed to log activity:', logError);
        // Don't fail the whole operation if logging fails
      }

      // Success! Show confirmation message
      alert(
        `Account created successfully for ${form.first_name} ${form.last_name}! ` +
        `A confirmation email has been sent to ${form.email}.`
      );

      // Reset form
      setForm({ email: "", first_name: "", last_name: "", password: "" });
      setErrors({});
      
      // Reload the accounts table
      onReload();
      
      // Close modal
      onClose();
      
    } catch (error) {
      console.error("Error creating account:", error);
      setErrors({ 
        submit: error.message || "Failed to create account. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ email: "", first_name: "", last_name: "", password: "" });
    setErrors({});
    setShowPassword(false);
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Create New Account</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errors.submit && (
          <div className="p-3 mb-3 text-red-700 bg-red-100 border border-red-400 rounded">
            {errors.submit}
          </div>
        )}
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              placeholder="Enter first name"
              isInvalid={!!errors.first_name}
            />
            <Form.Control.Feedback type="invalid">
              {errors.first_name}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="last_name"
              value={form.last_name}
              onChange={handleChange}
              placeholder="Enter last name"
              isInvalid={!!errors.last_name}
            />
            <Form.Control.Feedback type="invalid">
              {errors.last_name}
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Email <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter email address"
              isInvalid={!!errors.email}
            />
            <Form.Control.Feedback type="invalid">
              {errors.email}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Password <span className="text-danger">*</span></Form.Label>
            <div className="position-relative">
              <Form.Control
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create password (min. 6 characters)"
                isInvalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="btn btn-link position-absolute end-0 top-0"
                style={{ 
                  zIndex: 10, 
                  textDecoration: 'none',
                  color: '#6c757d' 
                }}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
              <Form.Control.Feedback type="invalid">
                {errors.password}
              </Form.Control.Feedback>
            </div>
            <Form.Text className="text-muted">
              User will receive a confirmation email to verify their account.
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="success" onClick={handleCreate} disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateAccountModal;