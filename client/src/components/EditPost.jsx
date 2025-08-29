import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { getPost, updatePost } from '../api'
import { toast } from 'react-toastify'

const PostSchema = Yup.object().shape({
  title: Yup.string().required('Title is required').max(100, 'Title too long'),
  content: Yup.string().required('Content is required').min(10, 'Content too short'),
  category: Yup.string().required('Category is required'),
  tags: Yup.string()
})

export default function EditPost() {
  const [post, setPost] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { id } = useParams()

  // Memoize loadPost to fix eslint warning
  const loadPost = useCallback(async () => {
    try {
      const res = await getPost(id)
      setPost(res.data)
      if (res.data.image) {
        setImagePreview(`http://localhost:5000${res.data.image}`)
      }
    } catch (err) {
      toast.error('Failed to load post')
      navigate('/my-posts')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    loadPost()
  }, [loadPost])

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const formData = new FormData()
      formData.append('title', values.title)
      formData.append('content', values.content)
      formData.append('category', values.category)
      formData.append('tags', values.tags)
      
      if (values.image) {
        formData.append('image', values.image)
      }

      await updatePost(id, formData)
      toast.success('Post updated successfully!')
      navigate('/my-posts')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update post')
    }
    setSubmitting(false)
  }

  const handleImageChange = (event, setFieldValue) => {
    const file = event.target.files[0]
    setFieldValue('image', file)
    
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  if (loading) return <div className="text-center p-8">Loading post...</div>

  if (!post) return <div className="text-center p-8">Post not found</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-8">
        <button 
          onClick={() => navigate('/my-posts')}
          className="mr-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to My Posts
        </button>
        <h1 className="text-3xl font-bold">Edit Post</h1>
      </div>
      
      <Formik
        initialValues={{
          title: post.title || '',
          content: post.content || '',
          category: post.category || 'General',
          tags: post.tags ? post.tags.join(', ') : '',
          image: null
        }}
        validationSchema={PostSchema}
        onSubmit={handleSubmit}
        enableReinitialize={true}
      >
        {({ isSubmitting, setFieldValue }) => (
          <Form className="space-y-6">
            <div>
              <Field
                type="text"
                name="title"
                placeholder="Post title"
                className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <ErrorMessage name="title" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Field
                  as="select"
                  name="category"
                  className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="General">General</option>
                  <option value="Technology">Technology</option>
                  <option value="Lifestyle">Lifestyle</option>
                  <option value="Business">Business</option>
                  <option value="Education">Education</option>
                  <option value="Health">Health</option>
                  <option value="Travel">Travel</option>
                </Field>
                <ErrorMessage name="category" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              <div>
                <Field
                  type="text"
                  name="tags"
                  placeholder="Tags (comma separated)"
                  className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ErrorMessage name="tags" component="div" className="text-red-500 text-sm mt-1" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e, setFieldValue)}
                className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {imagePreview && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Current/Preview Image:</p>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full max-w-md h-48 object-cover rounded-md border"
                  />
                </div>
              )}
            </div>

            <div>
              <Field
                as="textarea"
                name="content"
                rows="8"
                placeholder="Write your post content here..."
                className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <ErrorMessage name="content" component="div" className="text-red-500 text-sm mt-1" />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-500 text-white py-3 rounded-md hover:bg-blue-600 disabled:opacity-50 transition duration-200"
              >
                {isSubmitting ? 'Updating...' : 'Update Post'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/my-posts')}
                className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200"
              >
                Cancel
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}
