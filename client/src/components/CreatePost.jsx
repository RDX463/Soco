import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { createPost } from '../api'
import { toast } from 'react-toastify'

const PostSchema = Yup.object().shape({
  title: Yup.string().required('Title is required').max(100, 'Title too long'),
  content: Yup.string().required('Content is required').min(10, 'Content too short'),
  category: Yup.string().required('Category is required'),
  tags: Yup.string()
})

export default function CreatePost() {
  const [mediaFiles, setMediaFiles] = useState([])
  const [mediaPreviews, setMediaPreviews] = useState([])
  const navigate = useNavigate()

  const handleMediaChange = (event, setFieldValue) => {
    const files = Array.from(event.target.files)
    
    // Limit to 5 files
    if (files.length > 5) {
      toast.error('Maximum 5 files allowed')
      return
    }

    // Validate file sizes and types
    const validFiles = []
    const previews = []

    files.forEach(file => {
      // Check file size (10MB for images, 50MB for videos)
      const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large`)
        return
      }

      // Check file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error(`${file.name} is not a supported media type`)
        return
      }

      validFiles.push(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        previews.push({
          url: e.target.result,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          name: file.name
        })
        
        if (previews.length === validFiles.length) {
          setMediaPreviews(previews)
        }
      }
      reader.readAsDataURL(file)
    })

    setMediaFiles(validFiles)
    setFieldValue('media', validFiles)
  }

  const removeMedia = (index, setFieldValue) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index)
    const newPreviews = mediaPreviews.filter((_, i) => i !== index)
    
    setMediaFiles(newFiles)
    setMediaPreviews(newPreviews)
    setFieldValue('media', newFiles)
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const formData = new FormData()
      formData.append('title', values.title)
      formData.append('content', values.content)
      formData.append('category', values.category)
      formData.append('tags', values.tags)
      
      // Append multiple media files
      mediaFiles.forEach((file, index) => {
        formData.append('media', file)
      })

      await createPost(formData)
      toast.success('Post created successfully!')
      navigate('/posts')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create post')
    }
    setSubmitting(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-8">
        <button 
          onClick={() => navigate('/posts')}
          className="mr-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Feed
        </button>
        <h1 className="text-3xl font-bold">Create New Post</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <Formik
          initialValues={{
            title: '',
            content: '',
            category: 'General',
            tags: '',
            media: []
          }}
          validationSchema={PostSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, setFieldValue }) => (
            <Form className="space-y-6">
              <div>
                <Field
                  type="text"
                  name="title"
                  placeholder="What's your post about?"
                  className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
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

              {/* Multiple Media Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Media (Images/Videos - Max 5 files)
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => handleMediaChange(e, setFieldValue)}
                  className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                {/* Media Previews */}
                {mediaPreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {mediaPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        {preview.type === 'image' ? (
                          <img 
                            src={preview.url} 
                            alt={`Preview ${index + 1}`} 
                            className="w-full h-32 object-cover rounded-md border"
                          />
                        ) : (
                          <video 
                            src={preview.url} 
                            className="w-full h-32 object-cover rounded-md border"
                            controls
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMedia(index, setFieldValue)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Field
                  as="textarea"
                  name="content"
                  rows="6"
                  placeholder="Share your thoughts, experiences, or insights..."
                  className="w-full border border-gray-300 px-4 py-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ErrorMessage name="content" component="div" className="text-red-500 text-sm mt-1" />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-500 text-white py-3 rounded-md hover:bg-blue-600 disabled:opacity-50 transition duration-200 font-semibold"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Post'}
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate('/posts')}
                  className="px-8 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
}
