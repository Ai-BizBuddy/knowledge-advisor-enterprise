'use client';
import { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layouts';
import { useLoading } from '@/contexts/LoadingContext';
import { DocumentSearchResult } from '@/interfaces/DeepSearchTypes';
import { DeepSearchLayout } from '@/components/deepSearch';

const DeepSearchPage = () => {
  const { setLoading } = useLoading();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for testing - 50 AI-related documents
  const mockSearchResults: DocumentSearchResult[] = [
    {
      id: 'doc-1',
      title: 'AI Implementation Guidelines.pdf',
      content:
        'This document provides comprehensive guidelines for implementing artificial intelligence solutions in enterprise environments. It covers best practices, security considerations, and performance optimization strategies that teams should follow when deploying AI systems.',
      fileType: 'pdf',
      fileSize: '2.4 MB',
      uploadDate: '2024-08-15T10:30:00Z',
      knowledgeName: 'AI Technology Base',
      fileUrl:
        'http://www.thapra.lib.su.ac.th/m-talk/attachments/article/75/ebook.pdf',
    },
    {
      id: 'doc-2',
      title: 'Machine Learning Best Practices.docx',
      content:
        'Complete guide to machine learning best practices including data preprocessing, model selection, feature engineering, hyperparameter tuning, and model evaluation techniques for production environments.',
      fileType: 'docx',
      fileSize: '1.8 MB',
      uploadDate: '2024-08-20T14:15:00Z',
      knowledgeName: 'ML Documentation',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_DOC_2M.doc',
    },
    {
      id: 'doc-3',
      title: 'Deep Learning Architecture Guide.doc',
      content:
        'Detailed documentation on neural network architectures, including CNNs, RNNs, Transformers, and GANs. Covers implementation strategies, optimization techniques, and real-world applications.',
      fileType: 'doc',
      fileSize: '2.1 MB',
      uploadDate: '2024-07-10T11:20:00Z',
      knowledgeName: 'Deep Learning Hub',
      fileUrl:
        'https://docs.google.com/document/d/1ZkTBPQtEl-uBcDNEMVmmNuyt6KN--FnEJcyXjBcCS6c/edit?usp=sharing',
    },
    {
      id: 'doc-4',
      title: 'AI Ethics and Governance Framework.txt',
      content:
        'Comprehensive framework for AI ethics and governance including fairness, accountability, transparency, privacy protection, and bias mitigation strategies for responsible AI development.',
      fileType: 'txt',
      fileSize: '450 KB',
      uploadDate: '2024-08-28T16:45:00Z',
      knowledgeName: 'AI Ethics',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/02/file_example_TXT_1KB.txt',
    },
    {
      id: 'doc-5',
      title: 'Natural Language Processing Tutorial.md',
      content:
        'Step-by-step tutorial on NLP techniques including tokenization, sentiment analysis, named entity recognition, text classification, and language model implementation using modern frameworks.',
      fileType: 'md',
      fileSize: '825 KB',
      uploadDate: '2024-08-22T13:30:00Z',
      knowledgeName: 'NLP Resources',
      fileUrl:
        'https://raw.githubusercontent.com/microsoft/vscode/main/README.md',
    },
    {
      id: 'doc-6',
      title: 'Computer Vision Algorithms.xlsx',
      content:
        'Comprehensive collection of computer vision algorithms including object detection, image segmentation, facial recognition, and optical character recognition with performance benchmarks.',
      fileType: 'xlsx',
      fileSize: '3.2 MB',
      uploadDate: '2024-08-18T09:15:00Z',
      knowledgeName: 'Computer Vision',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_XLS_1000.xls',
    },
    {
      id: 'doc-7',
      title: 'AI Model Training Dataset.csv',
      content:
        'Large-scale dataset for training AI models with labeled examples, feature descriptions, data quality metrics, and preprocessing guidelines for optimal model performance.',
      fileType: 'csv',
      fileSize: '15.7 MB',
      uploadDate: '2024-08-12T14:20:00Z',
      knowledgeName: 'Training Data',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_XLS_100.xls',
    },
    {
      id: 'doc-8',
      title: 'Reinforcement Learning Guide.pdf',
      content:
        'Complete guide to reinforcement learning covering Q-learning, policy gradients, actor-critic methods, multi-agent systems, and applications in robotics and game playing.',
      fileType: 'pdf',
      fileSize: '2.8 MB',
      uploadDate: '2024-08-25T09:30:00Z',
      knowledgeName: 'RL Research',
      fileUrl:
        'http://www.thapra.lib.su.ac.th/m-talk/attachments/article/75/ebook.pdf',
    },
    {
      id: 'doc-9',
      title: 'AI Security Protocols.docx',
      content:
        'Security protocols for AI systems including adversarial attack prevention, model privacy, secure multi-party computation, and federated learning security measures.',
      fileType: 'docx',
      fileSize: '1.5 MB',
      uploadDate: '2024-08-19T16:00:00Z',
      knowledgeName: 'AI Security',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_DOC_2M.doc',
    },
    {
      id: 'doc-10',
      title: 'AutoML Platform Documentation.md',
      content:
        'Documentation for automated machine learning platforms covering automated feature selection, model architecture search, hyperparameter optimization, and deployment automation.',
      fileType: 'md',
      fileSize: '675 KB',
      uploadDate: '2024-08-14T11:45:00Z',
      knowledgeName: 'AutoML Tools',
      fileUrl:
        'https://raw.githubusercontent.com/microsoft/vscode/main/README.md',
    },
    {
      id: 'doc-11',
      title: 'AI Performance Benchmarks.xlsx',
      content:
        'Comprehensive benchmarking results for various AI models including accuracy metrics, inference speed, memory usage, and energy consumption across different hardware configurations.',
      fileType: 'xlsx',
      fileSize: '4.1 MB',
      uploadDate: '2024-08-21T14:30:00Z',
      knowledgeName: 'Performance Analysis',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_XLS_1000.xls',
    },
    {
      id: 'doc-12',
      title: 'Conversational AI Development.pdf',
      content:
        'Guide to developing conversational AI systems including chatbot architectures, dialogue management, intent recognition, and integration with messaging platforms.',
      fileType: 'pdf',
      fileSize: '3.3 MB',
      uploadDate: '2024-08-16T12:15:00Z',
      knowledgeName: 'Chatbot Development',
      fileUrl:
        'http://www.thapra.lib.su.ac.th/m-talk/attachments/article/75/ebook.pdf',
    },
    {
      id: 'doc-13',
      title: 'AI Hardware Optimization.doc',
      content:
        'Hardware optimization strategies for AI workloads including GPU acceleration, TPU utilization, edge computing deployment, and specialized AI chip architectures.',
      fileType: 'doc',
      fileSize: '1.9 MB',
      uploadDate: '2024-08-11T10:20:00Z',
      knowledgeName: 'Hardware Optimization',
      fileUrl:
        'https://docs.google.com/document/d/1ZkTBPQtEl-uBcDNEMVmmNuyt6KN--FnEJcyXjBcCS6c/edit?usp=sharing',
    },
    {
      id: 'doc-14',
      title: 'Federated Learning Implementation.txt',
      content:
        'Implementation guide for federated learning systems including client-server architecture, privacy-preserving aggregation, communication protocols, and real-world deployment scenarios.',
      fileType: 'txt',
      fileSize: '380 KB',
      uploadDate: '2024-08-26T15:30:00Z',
      knowledgeName: 'Federated Learning',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/02/file_example_TXT_1KB.txt',
    },
    {
      id: 'doc-15',
      title: 'AI Data Pipeline Architecture.json',
      content:
        'JSON configuration for AI data pipelines including data ingestion, preprocessing, feature engineering, model training, and deployment automation workflows.',
      fileType: 'json',
      fileSize: '285 KB',
      uploadDate: '2024-08-23T13:45:00Z',
      knowledgeName: 'Data Pipeline',
      fileUrl:
        'https://raw.githubusercontent.com/microsoft/vscode/main/README.md',
    },
    {
      id: 'doc-16',
      title: 'Explainable AI Techniques.pdf',
      content:
        'Comprehensive guide to explainable AI including LIME, SHAP, attention mechanisms, feature importance analysis, and interpretability tools for black-box models.',
      fileType: 'pdf',
      fileSize: '2.6 MB',
      uploadDate: '2024-08-17T11:00:00Z',
      knowledgeName: 'XAI Research',
      fileUrl:
        'http://www.thapra.lib.su.ac.th/m-talk/attachments/article/75/ebook.pdf',
    },
    {
      id: 'doc-17',
      title: 'AI Model Deployment Strategies.docx',
      content:
        'Deployment strategies for AI models including containerization, microservices architecture, API design, load balancing, and monitoring in production environments.',
      fileType: 'docx',
      fileSize: '2.2 MB',
      uploadDate: '2024-08-13T16:20:00Z',
      knowledgeName: 'Model Deployment',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_DOC_2M.doc',
    },
    {
      id: 'doc-18',
      title: 'Edge AI Development Guide.md',
      content:
        'Development guide for edge AI applications including model optimization, quantization, pruning, mobile deployment, and IoT integration strategies.',
      fileType: 'md',
      fileSize: '550 KB',
      uploadDate: '2024-08-24T14:10:00Z',
      knowledgeName: 'Edge Computing',
      fileUrl:
        'https://raw.githubusercontent.com/microsoft/vscode/main/README.md',
    },
    {
      id: 'doc-19',
      title: 'AI Testing and Validation.xlsx',
      content:
        'Testing frameworks for AI systems including unit testing, integration testing, performance testing, bias testing, and continuous validation methodologies.',
      fileType: 'xlsx',
      fileSize: '1.8 MB',
      uploadDate: '2024-08-27T10:45:00Z',
      knowledgeName: 'AI Testing',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_XLS_1000.xls',
    },
    {
      id: 'doc-20',
      title: 'Neural Architecture Search.py',
      content:
        'Python implementation of neural architecture search algorithms including evolutionary algorithms, reinforcement learning-based search, and differentiable architecture search.',
      fileType: 'py',
      fileSize: '425 KB',
      uploadDate: '2024-08-29T12:30:00Z',
      knowledgeName: 'NAS Research',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/02/file_example_TXT_1KB.txt',
    },
    {
      id: 'doc-21',
      title: 'AI Risk Assessment Framework.pdf',
      content:
        'Risk assessment framework for AI projects including technical risks, ethical considerations, regulatory compliance, and mitigation strategies for enterprise deployment.',
      fileType: 'pdf',
      fileSize: '1.7 MB',
      uploadDate: '2024-08-30T09:15:00Z',
      knowledgeName: 'Risk Management',
      fileUrl:
        'http://www.thapra.lib.su.ac.th/m-talk/attachments/article/75/ebook.pdf',
    },
    {
      id: 'doc-22',
      title: 'Multi-Modal AI Systems.docx',
      content:
        'Design and implementation of multi-modal AI systems combining text, image, audio, and video processing for comprehensive understanding and generation tasks.',
      fileType: 'docx',
      fileSize: '2.9 MB',
      uploadDate: '2024-08-08T15:40:00Z',
      knowledgeName: 'Multi-Modal AI',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_DOC_2M.doc',
    },
    {
      id: 'doc-23',
      title: 'AI Model Compression Techniques.txt',
      content:
        'Comprehensive guide to model compression including quantization, pruning, knowledge distillation, and low-rank approximation methods for efficient AI deployment.',
      fileType: 'txt',
      fileSize: '320 KB',
      uploadDate: '2024-08-07T11:25:00Z',
      knowledgeName: 'Model Optimization',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/02/file_example_TXT_1KB.txt',
    },
    {
      id: 'doc-24',
      title: 'AI Data Augmentation Methods.md',
      content:
        'Data augmentation techniques for improving AI model performance including image augmentation, text augmentation, synthetic data generation, and domain adaptation methods.',
      fileType: 'md',
      fileSize: '480 KB',
      uploadDate: '2024-08-06T13:50:00Z',
      knowledgeName: 'Data Augmentation',
      fileUrl:
        'https://raw.githubusercontent.com/microsoft/vscode/main/README.md',
    },
    {
      id: 'doc-25',
      title: 'Transformer Architecture Deep Dive.pdf',
      content:
        'In-depth analysis of transformer architectures including attention mechanisms, positional encoding, encoder-decoder structures, and variants like BERT, GPT, and T5.',
      fileType: 'pdf',
      fileSize: '3.8 MB',
      uploadDate: '2024-08-05T16:30:00Z',
      knowledgeName: 'Transformer Models',
      fileUrl:
        'http://www.thapra.lib.su.ac.th/m-talk/attachments/article/75/ebook.pdf',
    },
    {
      id: 'doc-26',
      title: 'AI Monitoring and Observability.xlsx',
      content:
        'Monitoring and observability frameworks for AI systems including model drift detection, performance monitoring, data quality assessment, and alerting mechanisms.',
      fileType: 'xlsx',
      fileSize: '2.3 MB',
      uploadDate: '2024-08-04T14:15:00Z',
      knowledgeName: 'AI Operations',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_XLS_1000.xls',
    },
    {
      id: 'doc-27',
      title: 'Generative AI Applications.docx',
      content:
        'Applications of generative AI including text generation, image synthesis, code generation, music composition, and creative content production across various industries.',
      fileType: 'docx',
      fileSize: '2.7 MB',
      uploadDate: '2024-08-03T10:20:00Z',
      knowledgeName: 'Generative AI',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_DOC_2M.doc',
    },
    {
      id: 'doc-28',
      title: 'AI Research Methodologies.doc',
      content:
        'Research methodologies for AI including experimental design, statistical analysis, reproducibility guidelines, and publication standards for AI research papers.',
      fileType: 'doc',
      fileSize: '1.4 MB',
      uploadDate: '2024-08-02T12:45:00Z',
      knowledgeName: 'Research Methods',
      fileUrl:
        'https://docs.google.com/document/d/1ZkTBPQtEl-uBcDNEMVmmNuyt6KN--FnEJcyXjBcCS6c/edit?usp=sharing',
    },
    {
      id: 'doc-29',
      title: 'AI Bias Detection and Mitigation.py',
      content:
        'Python tools and techniques for detecting and mitigating bias in AI systems including fairness metrics, bias testing frameworks, and algorithmic fairness approaches.',
      fileType: 'py',
      fileSize: '385 KB',
      uploadDate: '2024-08-01T15:10:00Z',
      knowledgeName: 'AI Fairness',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/02/file_example_TXT_1KB.txt',
    },
    {
      id: 'doc-30',
      title: 'Quantum Machine Learning.pdf',
      content:
        'Introduction to quantum machine learning including quantum algorithms, quantum neural networks, variational quantum circuits, and potential advantages over classical ML.',
      fileType: 'pdf',
      fileSize: '2.1 MB',
      uploadDate: '2024-07-31T11:35:00Z',
      knowledgeName: 'Quantum ML',
      fileUrl:
        'http://www.thapra.lib.su.ac.th/m-talk/attachments/article/75/ebook.pdf',
    },
    {
      id: 'doc-31',
      title: 'AI Product Management Guide.txt',
      content:
        'Product management guide for AI products including requirement gathering, user experience design, go-to-market strategies, and success metrics for AI-powered applications.',
      fileType: 'txt',
      fileSize: '295 KB',
      uploadDate: '2024-07-30T13:20:00Z',
      knowledgeName: 'AI Product Management',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/02/file_example_TXT_1KB.txt',
    },
    {
      id: 'doc-32',
      title: 'AI Legal and Regulatory Compliance.md',
      content:
        'Legal and regulatory compliance for AI systems including GDPR compliance, algorithmic accountability, intellectual property considerations, and regulatory frameworks.',
      fileType: 'md',
      fileSize: '410 KB',
      uploadDate: '2024-07-29T16:50:00Z',
      knowledgeName: 'AI Legal',
      fileUrl:
        'https://raw.githubusercontent.com/microsoft/vscode/main/README.md',
    },
    {
      id: 'doc-33',
      title: 'AI Industry Case Studies.xlsx',
      content:
        'Collection of AI implementation case studies across industries including healthcare, finance, manufacturing, retail, and transportation with lessons learned and best practices.',
      fileType: 'xlsx',
      fileSize: '5.2 MB',
      uploadDate: '2024-07-28T14:25:00Z',
      knowledgeName: 'Industry Applications',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_XLS_1000.xls',
    },
    {
      id: 'doc-34',
      title: 'AI Team Building and Management.docx',
      content:
        'Guide to building and managing AI teams including role definitions, hiring strategies, skill development, team structure, and collaboration best practices.',
      fileType: 'docx',
      fileSize: '1.6 MB',
      uploadDate: '2024-07-27T10:40:00Z',
      knowledgeName: 'Team Management',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_DOC_2M.doc',
    },
    {
      id: 'doc-35',
      title: 'AI Infrastructure Architecture.json',
      content:
        'Infrastructure architecture configurations for AI workloads including cloud deployment, container orchestration, data storage, and compute resource management.',
      fileType: 'json',
      fileSize: '340 KB',
      uploadDate: '2024-07-26T12:15:00Z',
      knowledgeName: 'AI Infrastructure',
      fileUrl:
        'https://raw.githubusercontent.com/microsoft/vscode/main/README.md',
    },
    {
      id: 'doc-36',
      title: 'AI Model Versioning and Governance.pdf',
      content:
        'Model versioning and governance practices including model lifecycle management, version control systems, approval workflows, and compliance tracking for AI models.',
      fileType: 'pdf',
      fileSize: '1.9 MB',
      uploadDate: '2024-07-25T15:30:00Z',
      knowledgeName: 'Model Governance',
      fileUrl:
        'http://www.thapra.lib.su.ac.th/m-talk/attachments/article/75/ebook.pdf',
    },
    {
      id: 'doc-37',
      title: 'AI Training Data Management.csv',
      content:
        'Training data management strategies including data collection, annotation, quality control, versioning, and privacy protection for large-scale AI training datasets.',
      fileType: 'csv',
      fileSize: '8.5 MB',
      uploadDate: '2024-07-24T11:45:00Z',
      knowledgeName: 'Data Management',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_XLS_100.xls',
    },
    {
      id: 'doc-38',
      title: 'AI Startup Strategy Guide.txt',
      content:
        'Strategic guide for AI startups including market analysis, competitive positioning, funding strategies, technology roadmap, and scaling considerations.',
      fileType: 'txt',
      fileSize: '275 KB',
      uploadDate: '2024-07-23T14:20:00Z',
      knowledgeName: 'Startup Strategy',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/02/file_example_TXT_1KB.txt',
    },
    {
      id: 'doc-39',
      title: 'AI Customer Experience Enhancement.md',
      content:
        'Using AI to enhance customer experience including personalization engines, recommendation systems, customer service automation, and predictive analytics.',
      fileType: 'md',
      fileSize: '520 KB',
      uploadDate: '2024-07-22T16:10:00Z',
      knowledgeName: 'Customer Experience',
      fileUrl:
        'https://raw.githubusercontent.com/microsoft/vscode/main/README.md',
    },
    {
      id: 'doc-40',
      title: 'AI Research Paper Analysis.xlsx',
      content:
        'Analysis of trending AI research papers including citation metrics, research trends, breakthrough discoveries, and emerging research directions in artificial intelligence.',
      fileType: 'xlsx',
      fileSize: '3.7 MB',
      uploadDate: '2024-07-21T13:55:00Z',
      knowledgeName: 'Research Analysis',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_XLS_1000.xls',
    },
    {
      id: 'doc-41',
      title: 'AI Energy Efficiency Optimization.docx',
      content:
        'Energy efficiency optimization for AI systems including green computing practices, energy-aware training, efficient hardware utilization, and carbon footprint reduction.',
      fileType: 'docx',
      fileSize: '2.0 MB',
      uploadDate: '2024-07-20T10:30:00Z',
      knowledgeName: 'Green AI',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_DOC_2M.doc',
    },
    {
      id: 'doc-42',
      title: 'AI Human-Computer Interaction.doc',
      content:
        'Human-computer interaction design for AI systems including user interface design, user experience optimization, accessibility considerations, and human-AI collaboration.',
      fileType: 'doc',
      fileSize: '1.3 MB',
      uploadDate: '2024-07-19T12:40:00Z',
      knowledgeName: 'HCI Design',
      fileUrl:
        'https://docs.google.com/document/d/1ZkTBPQtEl-uBcDNEMVmmNuyt6KN--FnEJcyXjBcCS6c/edit?usp=sharing',
    },
    {
      id: 'doc-43',
      title: 'AI Continual Learning Systems.py',
      content:
        'Implementation of continual learning systems for AI including catastrophic forgetting prevention, incremental learning algorithms, and lifelong learning frameworks.',
      fileType: 'py',
      fileSize: '455 KB',
      uploadDate: '2024-07-18T15:25:00Z',
      knowledgeName: 'Continual Learning',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/02/file_example_TXT_1KB.txt',
    },
    {
      id: 'doc-44',
      title: 'AI Innovation Management.pdf',
      content:
        'Innovation management for AI projects including idea generation, prototype development, innovation metrics, technology transfer, and commercialization strategies.',
      fileType: 'pdf',
      fileSize: '2.4 MB',
      uploadDate: '2024-07-17T11:15:00Z',
      knowledgeName: 'Innovation Management',
      fileUrl:
        'http://www.thapra.lib.su.ac.th/m-talk/attachments/article/75/ebook.pdf',
    },
    {
      id: 'doc-45',
      title: 'AI Quality Assurance Framework.txt',
      content:
        'Quality assurance framework for AI systems including testing methodologies, validation procedures, quality metrics, and continuous improvement processes.',
      fileType: 'txt',
      fileSize: '365 KB',
      uploadDate: '2024-07-16T14:05:00Z',
      knowledgeName: 'Quality Assurance',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/02/file_example_TXT_1KB.txt',
    },
    {
      id: 'doc-46',
      title: 'AI Partnership and Collaboration.md',
      content:
        'Strategic partnerships and collaboration models for AI development including academic partnerships, industry collaborations, open source contributions, and consortium participation.',
      fileType: 'md',
      fileSize: '440 KB',
      uploadDate: '2024-07-15T16:50:00Z',
      knowledgeName: 'Partnerships',
      fileUrl:
        'https://raw.githubusercontent.com/microsoft/vscode/main/README.md',
    },
    {
      id: 'doc-47',
      title: 'AI Market Analysis Report.xlsx',
      content:
        'Comprehensive market analysis for AI technologies including market size, growth projections, competitive landscape, investment trends, and emerging opportunities.',
      fileType: 'xlsx',
      fileSize: '4.8 MB',
      uploadDate: '2024-07-14T13:20:00Z',
      knowledgeName: 'Market Research',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_XLS_1000.xls',
    },
    {
      id: 'doc-48',
      title: 'AI Talent Development Program.docx',
      content:
        'Talent development program for AI professionals including curriculum design, certification paths, mentorship programs, and career progression frameworks.',
      fileType: 'docx',
      fileSize: '2.5 MB',
      uploadDate: '2024-07-13T10:35:00Z',
      knowledgeName: 'Talent Development',
      fileUrl:
        'https://file-examples.com/storage/fe1efd5c8b4e6db7b9c3f3b/2017/10/file_example_DOC_2M.doc',
    },
    {
      id: 'doc-49',
      title: 'AI Future Trends and Predictions.json',
      content:
        'Analysis of future trends and predictions in AI including emerging technologies, research directions, societal impact, and long-term implications for various industries.',
      fileType: 'json',
      fileSize: '315 KB',
      uploadDate: '2024-07-12T12:10:00Z',
      knowledgeName: 'Future Trends',
      fileUrl:
        'https://raw.githubusercontent.com/microsoft/vscode/main/README.md',
    },
    {
      id: 'doc-50',
      title: 'AI Implementation Roadmap.pdf',
      content:
        'Strategic roadmap for AI implementation including planning phases, milestone definitions, resource allocation, timeline management, and success measurement criteria.',
      fileType: 'pdf',
      fileSize: '3.1 MB',
      uploadDate: '2024-07-11T15:45:00Z',
      knowledgeName: 'Implementation Strategy',
      fileUrl:
        'http://www.thapra.lib.su.ac.th/m-talk/attachments/article/75/ebook.pdf',
    },
  ];

  const [searchResults, setSearchResults] = useState<DocumentSearchResult[]>(
    [],
  );
  const [allSearchResults, setAllSearchResults] = useState<
    DocumentSearchResult[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isNoResults, setIsNoResults] = useState(false);
  const [loading, setLoadingState] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination values
  const totalResults = allSearchResults.length;
  const totalPages = Math.ceil(totalResults / 10);
  const startIndex = (currentPage - 1) * 10;
  const endIndex = startIndex + 10;

  // Update displayed results when page or results per page changes
  useEffect(() => {
    const paginatedResults = allSearchResults.slice(startIndex, endIndex);
    setSearchResults(paginatedResults);
  }, [allSearchResults, currentPage, startIndex, endIndex]);

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoadingState(true);
    setIsSearching(true);
    setIsNoResults(false);
    setCurrentPage(1); // Reset to first page on new search

    try {
      console.log('Searching for:', searchQuery);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Use mock data for testing
      const filteredResults = mockSearchResults.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.knowledgeName?.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      setAllSearchResults(filteredResults);
      setIsNoResults(filteredResults.length === 0);

      console.log('Search results:', filteredResults);

      // Original API code (commented out for testing) ห้ามลบ

      // const kbId = await getKnowledgeBaseIDs().then((ids) => ids);
      // const results: DeepSearchRes[] = await executeSearch({
      //   query: searchQuery,
      //   // knowledge_ids: kbId,
      // });

      // if (!results || results.length === 0) {
      //   console.log("No results found");
      //   setIsNoResults(true);
      //   return;
      // }

      // const documentIds = await Promise.all(
      //   results.map(async (res: DeepSearchRes) => res.metadata.document_id),
      // );
      // const KBIds = await Promise.all(
      //   results.map(async (res: DeepSearchRes) => res.metadata.knowledge_id),
      // );
      // const docRes = await getDocumentById(documentIds);
      // const kbRes = await getKnowledgeBaseByIDs(KBIds);

      // console.log("Raw search results:", docRes);
      // console.log("Knowledge Base results:", kbRes);

      // // Map document and knowledge base results to search results
      // const mappedResults: DocumentSearchResult[] = docRes.map(
      //   (doc: Document) => {
      //     const knowledge = kbRes.find(
      //       (kb: Project) => kb.id === doc.knowledge_base_id,
      //     );
      //     return {
      //       id: doc.id,
      //       title: doc.name,
      //       content: doc.content,
      //       fileType: doc.file_type,
      //       fileSize: doc.file_size,
      //       uploadDate: doc.updated_at,
      //       knowledgeName: knowledge ? knowledge.name : null,
      //       document: doc,
      //       // knowledgeBase: knowledge || null,
      //     };
      //   },
      // );

      // setSearchResults(mappedResults);
    } catch (error) {
      console.error('Search error:', error);
      setIsNoResults(true);
    } finally {
      setIsSearching(false);
      setLoadingState(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setAllSearchResults([]);
    setIsNoResults(false);
    setIsSearching(false);
    setCurrentPage(1);
  };

  const handleResultClick = (result: DocumentSearchResult) => {
    console.log('Document clicked:', result);
    // In real implementation, this would open the document or navigate to document detail
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <PageLayout
      title='Deep Search'
      subtitle='Search through your documents with AI-powered intelligence'
    >
      {/* Search Section */}
      <div className='card mb-6'>
        <div className='space-y-4 p-4'>
          {/* Main Search Bar */}
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 flex items-center pl-4'>
              <svg
                className='h-5 w-5 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
            </div>
            <input
              type='text'
              value={searchQuery}
              disabled={isSearching}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search through documents... (e.g., 'AI guidelines', 'implementation', 'best practices')"
              className='w-full rounded-lg border border-gray-300 bg-white py-3 pr-32 pl-12 text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-400'
            />
            <div className='absolute inset-y-0 right-0 flex'>
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  disabled={isSearching}
                  className='flex items-center px-3 text-gray-500 transition-colors hover:text-gray-700 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:text-gray-200'
                  title='Clear search'
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isSearching}
                className='flex items-center rounded-r-lg bg-blue-600 px-4 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400'
              >
                {isSearching ? (
                  <div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent' />
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <DeepSearchLayout
        searchQuery={searchQuery}
        searchResults={searchResults}
        loading={loading}
        isSearching={isSearching}
        isNoResults={isNoResults}
        onResultClick={handleResultClick}
        currentPage={currentPage}
        totalPages={totalPages}
        resultsPerPage={10}
        totalResults={totalResults}
        onPageChange={handlePageChange}
      />
    </PageLayout>
  );
};

export default DeepSearchPage;
