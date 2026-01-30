// =========================================
// 1. Mock Data (更新后)
// =========================================
const mockData = {
    "project_name": "新疆自治区一体化在线政务服务平台",
    "project_code": "GOV-2026-001",
    "project_timeline": {
      "start_date": "2025-11-01",
      "plan_end_date": "2026-03-31",
      "total_days": 151,
      "elapsed_days": 90
    },
    "current_stage_index": 2, 
    "health_score": 58,
    "health_status": "red",
    "update_time": "2026-01-30 14:30",
  
    "team": { 
      "leader": "王局长", 
      "manager": "张三", 
      "contractor": "新疆数字政务建设集团"
    },
  
    "milestones": [
      { "name": "需求确认", "plan_date": "2025-12-15", "actual_date": "2025-12-20", "status": "completed", "delay_days": 5 },
      { "name": "中期阶段汇报", "plan_date": "2026-01-25", "actual_date": null, "status": "delay", "delay_days": 4 },
      { "name": "用户测试(UAT)", "plan_date": "2026-02-10", "actual_date": null, "status": "pending", "delay_days": 0 },
      { "name": "竣工验收", "plan_date": "2026-03-01", "actual_date": null, "status": "pending", "delay_days": 0 }
    ],
  
    "stages": [
      {
        "name": "立项与决策", "status": "completed",
        "metrics": { "duration": "45天", "docs_count": 8, "approval_rate": "100%", "risk_count": 0 },
        "sub_tasks": [
          {"name": "项目建议书申报", "status": "done"},
          {"name": "财政资金批复", "status": "done"}
        ]
      },
      {
        "name": "启动与规划", "status": "completed",
        "metrics": { "duration": "20天", "docs_count": 12, "budget_check": "正常", "risk_count": 1 },
        "sub_tasks": [
          {"name": "招投标完成", "status": "done"},
          {"name": "合同签订", "status": "done"}
        ]
      },
      {
        "name": "执行与控制", "status": "current",
        "metrics": { "duration": "已延期", "docs_count": 45, "risk_count": 6, "change_count": 3 },
        "sub_tasks": [
          {"name": "需求分析确认", "status": "done"},
          {"name": "系统架构设计", "status": "done"},
          {"name": "核心功能开发", "status": "delay"},
          {"name": "中期阶段汇报", "status": "pending"},
          {"name": "数据迁移方案", "status": "pending"}
        ]
      },
      {
        /* 2. 补全后两个阶段的任务数据 */
        "name": "收尾与验收", "status": "pending",
        "metrics": { "duration": "预计30天", "docs_count": 0, "bug_count": 0, "pass_rate": "--" },
        "sub_tasks": [
          {"name": "系统上线试运行", "status": "pending"},
          {"name": "初步验收会", "status": "pending"},
          {"name": "第三方安全测评", "status": "pending"},
          {"name": "竣工验收报告", "status": "pending"}
        ]
      },
      {
        "name": "后评估", "status": "pending",
        "metrics": { "duration": "预计15天", "satisfaction": "--", "ops_cost": "--" },
        "sub_tasks": [
          {"name": "运维团队移交", "status": "pending"},
          {"name": "项目绩效自评", "status": "pending"},
          {"name": "档案归档", "status": "pending"}
        ]
      }
    ],
  
    "progress": {"plan":85, "actual":60, "gap": -25},
    "fund": {"total": 1200, "used": 1026, "rate": 85.5}, /* 3. 使用率数据 */
    "risk": {"high": 2, "medium": 4, "low": 6, "total": 12} /* 4. 风险总数 */
  };
  
  // =========================================
  // 2. Initialization
  // =========================================
  document.addEventListener('DOMContentLoaded', () => {
      initUI(mockData);
  });
  
  function initUI(data) {
      // 头部信息
      setText('pName', data.project_name);
      setText('pCode', data.project_code);
      setText('pLeader', data.team.leader);
      setText('pManager', data.team.manager);
      setText('pContractor', data.team.contractor);
      setText('updateTime', data.update_time);
      setText('projectPeriod', `${data.project_timeline.start_date} ~ ${data.project_timeline.plan_end_date}`);
      setText('totalDays', data.project_timeline.total_days);
      setText('elapsedDays', data.project_timeline.elapsed_days);
      setText('currentStageText', data.stages.find(s => s.status === 'current')?.name || '未知阶段');
  
      // 警报
      if(data.health_status === 'red' || data.health_score < 60) {
          document.getElementById('alertBanner').style.display = 'block';
          setText('alertDesc', `【严重警告】项目健康分仅 ${data.health_score}分，存在 ${data.risk.high} 项高风险问题，建议立即介入督办。`);
      }
  
      renderKPIs(data);
      renderLifecycle(data);
      renderMilestones(data);
  
      // 默认显示当前阶段
      const currentIdx = data.stages.findIndex(s => s.status === 'current');
      if(currentIdx !== -1) showStageDetail(currentIdx);
  }
  
  function setText(id, text) {
      const el = document.getElementById(id);
      if(el) el.innerText = text;
  }
  
  // =========================================
  // 3. Chart Rendering
  // =========================================
  function renderKPIs(data) {
      // 健康度
      const hChart = echarts.init(document.getElementById('healthGauge'));
      hChart.setOption({
          series: [{
              type: 'gauge',
              startAngle: 180, endAngle: 0,
              min: 0, max: 100,
              radius: '110%',
              center: ['50%', '70%'],
              splitNumber: 5,
              itemStyle: { color: data.health_score < 60 ? '#F53F3F' : '#1664FF' },
              progress: { show: true, width: 12, roundCap: true },
              pointer: { show: true, length: '60%', width: 6, itemStyle: { color: 'auto' } },
              axisLine: { lineStyle: { width: 12, color: [[0.3, '#F53F3F'], [0.7, '#FF7D00'], [1, '#1664FF']] } },
              axisTick: { distance: -18, length: 6, lineStyle: { color: '#fff', width: 2 } },
              splitLine: { distance: -18, length: 12, lineStyle: { color: '#fff', width: 3 } },
              axisLabel: { distance: -35, color: '#999', fontSize: 10 },
              detail: { show: false },
              data: [{ value: data.health_score }]
          }]
      });
      setText('healthScoreDisplay', data.health_score);
      const hTag = document.getElementById('healthStatusTag');
      if(data.health_score < 60) {
          hTag.innerText = '高风险'; hTag.style.background = '#FFECE8'; hTag.style.color = '#F53F3F';
      } else {
          hTag.innerText = '正常'; hTag.style.background = '#E8FFEA'; hTag.style.color = '#00B42A';
      }
  
      // 进度条 (修改：延期天数现在在标题行，这里只负责数据填充)
      document.getElementById('barActual').style.width = data.progress.actual + '%';
      setText('txtActual', data.progress.actual + '%');
      document.getElementById('barPlan').style.width = data.progress.plan + '%';
      setText('txtPlan', data.progress.plan + '%');
      setText('delayDays', Math.abs(data.progress.gap));
  
      // 资金圆环 (增加使用率)
      const fChart = echarts.init(document.getElementById('chartFund'));
      fChart.setOption({
          color: ['#1664FF', '#F2F3F5'],
          series: [{
              type: 'pie', radius: ['65%', '85%'], center: ['50%', '50%'],
              label: { show: false },
              data: [
                  { value: data.fund.used },
                  { value: data.fund.total - data.fund.used }
              ]
          }]
      });
      setText('totalFund', data.fund.total);
      setText('remainFund', data.fund.total - data.fund.used);
      setText('fundRate', data.fund.rate + '%');
  
      // 风险圆环 (增加总数)
      const rChart = echarts.init(document.getElementById('chartRisk'));
      rChart.setOption({
          color: ['#F53F3F', '#FF7D00', '#1664FF'],
          series: [{
              type: 'pie', radius: ['65%', '85%'], center: ['50%', '50%'],
              label: { show: false },
              data: [
                  { value: data.risk.high },
                  { value: data.risk.medium },
                  { value: data.risk.low }
              ]
          }]
      });
      setText('riskTotal', data.risk.total);
      setText('riskHigh', data.risk.high);
      setText('riskMid', data.risk.medium);
      setText('riskLow', data.risk.low);
  
      window.addEventListener('resize', () => { hChart.resize(); fChart.resize(); rChart.resize(); });
  }
  
  // =========================================
  // 4. Lifecycle Logic
  // =========================================
  function renderLifecycle(data) {
      const container = document.getElementById('lifecycleSteps');
      let html = '';
      
      data.stages.forEach((stage, idx) => {
          let statusClass = '';
          let iconHtml = idx + 1;
          let dateText = '待定';
  
          if (stage.status === 'completed') {
              statusClass = 'completed';
              iconHtml = '<i class="fas fa-check"></i>';
              dateText = '已完成';
          } else if (stage.status === 'current') {
              statusClass = 'current';
              iconHtml = '<i class="fas fa-play" style="font-size:12px"></i>';
              dateText = '进行中';
          }
  
          html += `
              <div class="step-node ${statusClass}" onclick="showStageDetail(${idx})">
                  <div class="step-icon">${iconHtml}</div>
                  <div class="step-name">${stage.name}</div>
                  <div class="step-date-tag">${dateText}</div>
              </div>
          `;
      });
      container.innerHTML = html;
  }
  
  function showStageDetail(idx) {
      const stage = mockData.stages[idx];
      const metricsContainer = document.getElementById('detailMetrics');
      const listContainer = document.getElementById('detailTaskList');
      
      document.querySelectorAll('.step-node').forEach((el, i) => {
          if(i === idx) el.classList.add('current');
          else if(mockData.stages[i].status !== 'current') el.classList.remove('current');
      });
  
      const metricsMap = [
          { key: 'duration', label: '阶段工期', icon: 'fa-clock', color: '#1664FF' },
          { key: 'docs_count', label: '产出文档', icon: 'fa-file-alt', color: '#722ED1' },
          { key: 'approval_rate', label: '审批通过率', icon: 'fa-check-double', color: '#00B42A' },
          { key: 'risk_count', label: '关联风险', icon: 'fa-exclamation-triangle', color: '#FF7D00' }
      ];
      
      metricsContainer.innerHTML = metricsMap.map(cfg => `
          <div class="metric-box">
              <i class="fas ${cfg.icon} m-icon" style="color:${cfg.color}"></i>
              <div class="m-val" style="color:${cfg.color}">${stage.metrics[cfg.key] || '--'}</div>
              <div class="m-lbl">${cfg.label}</div>
          </div>
      `).join('');
  
      if(stage.sub_tasks && stage.sub_tasks.length) {
          listContainer.innerHTML = stage.sub_tasks.map(t => {
              let badgeClass = 'pending';
              let badgeText = '未开始';
              if(t.status === 'done') { badgeClass = 'done'; badgeText = '已完成'; }
              if(t.status === 'delay') { badgeClass = 'delay'; badgeText = '已延期'; }
              if(t.status === 'pending' && stage.status === 'current') { badgeText = '进行中'; } // 细微文案调整
              
              return `
                  <div class="task-item">
                      <div class="task-left">
                          <i class="fas fa-circle" style="font-size:6px; color:#C9CDD4"></i>
                          <span>${t.name}</span>
                      </div>
                      <span class="status-badge ${badgeClass}">${badgeText}</span>
                  </div>
              `;
          }).join('');
      } else {
          listContainer.innerHTML = '<div style="text-align:center;color:#999;padding:20px">暂无数据</div>';
      }
  
      document.getElementById('stageDetailPanel').style.display = 'block';
  }
  
  // =========================================
  // 5. Milestones Logic
  // =========================================
  function renderMilestones(data) {
      const container = document.getElementById('milestoneGrid');
      if(!data.milestones) return;
  
      const iconMap = {
          "需求确认": "fa-clipboard-check",
          "中期阶段汇报": "fa-chart-pie",
          "用户测试(UAT)": "fa-users-cog",
          "竣工验收": "fa-award"
      };
  
      container.innerHTML = data.milestones.map(m => {
          let statusClass = 'pending';
          let statusText = '待开始';
          
          if(m.status === 'completed') { statusClass = 'done'; statusText = '已完成'; }
          else if(m.status === 'delay') { statusClass = 'delay'; statusText = '已延期'; }
  
          const iconClass = iconMap[m.name] || 'fa-flag';
  
          return `
              <div class="milestone-card ${statusClass}">
                  <div class="ms-header-row">
                      <div class="ms-icon-box">
                          <i class="fas ${iconClass}"></i>
                      </div>
                      <span class="ms-status-text">${statusText}</span>
                  </div>
                  
                  <div class="ms-title-large">${m.name}</div>
                  
                  <div class="ms-info-row">
                      <span class="ms-label">计划完成</span>
                      <span class="ms-val">${m.plan_date}</span>
                  </div>
                  <div class="ms-info-row">
                      <span class="ms-label">实际完成</span>
                      <span class="ms-val">${m.actual_date || '--'}</span>
                  </div>
                  
                  ${m.status === 'delay' ? 
                      `<div class="delay-tag-block">
                          <i class="fas fa-exclamation-triangle"></i> 严重延期 ${m.delay_days} 天
                       </div>` : ''}
              </div>
          `;
      }).join('');
  }